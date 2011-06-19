function Links(callback) {
  this.links = [];  
  this.shortenUrls = true;
  //this.setCurrentLinkRenderer(currentRenderer);
  that = this;
  this.readLinks(function() {
		that.renderLinks();
		callback();
	});
};

Links.prototype.setShortenUrlText = function (bool) {
  this.shortenUrls = bool;
};

Links.prototype.shortenUrlText = function (urlText) {
  var len = urlText.length;
  if (len > 40) {
    urlText = urlText.substring(0, 24) + ' [...] ' + urlText.substring(len-24, len-1);
  }                 
  return urlText;
};

Links.prototype.readLinks = function (callback) {
  $.getJSON('/l', function(json) {
    $.each(json, function(i, item) {
      if (i > 0)  links.addLink(item); // skip header..        
    });
    callback();
  });
};

Links.prototype.clearLinks = function () {
	this.links = [];
};

Links.prototype.addLink = function (linkData) {  
  this.links.unshift({      'visible':       true,
							'key':           linkData[0], 
							'url':           linkData[1], 
							'urlText':       this.shortenUrls ? this.shortenUrlText(linkData[1]) : linkData[1],
							'comment':       linkData[2], 
							'searchComment': this.prepareCommentForFilter(linkData[2]),
							'date':          linkData[3]       });
};
 

Links.prototype.filterFields = ['url', 'searchComment'];
                         
Links.prototype.prepareCommentForFilter = function (comment) {  
  return comment.replace(/(&auml;)|(&ouml;)|(&uuml;)|(&Auml;)|(&Ouml;)|(&Uuml;)|(&szlig;)/g, '.');
};
  
Links.prototype.setFilter = function (nameRegexp) {
  nameRegexp = nameRegexp.replace(/[^A-Za-z0-9 \(\)\[\]\*\+\{\}]/g, '.');
  nameRegexp = new RegExp(nameRegexp, 'i');
  for (var lNum = 0; lNum < this.links.length; lNum++) {
    var linkData = this.links[lNum];
    var found = false;
    for (var n = 0; n < this.filterFields.length; n++) {
      if (linkData[this.filterFields[n]].match(nameRegexp)) {
        found = true;
        break;
      }
    }    
    linkData.visible = found;
  }
};

Links.prototype.clearFilter = function () {
  for (var n = 0; n < this.links.length; n++) {
	this.links[n].visible = true;
  }
};

Links.prototype.currentLinkRenderer = 0;

function BaseRenderer () {};
BaseRenderer.prototype.getRenderArea = function () {
	return $('#link-container');
};
BaseRenderer.prototype.clearArea = function () {
	this.getRenderArea().find('*').fadeOut();
	this.getRenderArea().empty();	
};

function SimpleRenderer () { BaseRenderer.call(this); };
SimpleRenderer.prototype = new BaseRenderer();
SimpleRenderer.prototype.constructor = SimpleRenderer;
SimpleRenderer.prototype.name = 'RectRender';
SimpleRenderer.prototype.render = function (links) {
  this.clearArea();  
  var parElement = this.getRenderArea().append('<ol></ol>').find('ol');
  $.each(links, function(i, linkData) {    
	if (linkData.visible == true) {
	  var newEl = $('#link-cell-template').clone().attr('id', 'link-'+linkData.key).fadeIn('slow');        
	  
	  newEl.find('a').attr('href', linkData.url);           
	  newEl.find('#link-url').text(linkData.urlText);
	  newEl.find('#link-comment').html(linkData.comment);
	  newEl.find('#link-date').text(linkData.date);
	  newEl.find('#link-key').text(linkData.key);      
/*	  newEl.click(function() {
		
		newEl.openOverlay();
	  });*/
	  newEl.appendTo(parElement.append('<li></li>').find('li').last());
	}
  });
};

function PutArray () { 
	this.values = { };
	this.keys = [];
};
PutArray.prototype.get = function (key) {
	if (this.values[key] == null) {
		var pa = new PutArray();
		this.values[key] = pa;
	}
	if (!this.includeKey(key))
		this.keys.unshift(key);
	return this.values[key];
};

PutArray.prototype.includeKey = function (key) {
	for (var n = 0; n < this.keys.length; n++) {
		if (this.keys[n] == key)
			return true;
	}
	return false;
};

PutArray.prototype.store = function (data) {
	if (this.values['data'] == null)
		this.values['data'] = [];
	this.values['data'].unshift(data);
};
PutArray.prototype.length = function() {
	return this.values['data'].length;
};
PutArray.prototype.getValue = function(idx) {
	return this.values['data'][idx];
};
PutArray.prototype.getKeys = function() {
	return this.keys;
};

function DailyRenderer () { BaseRenderer.call(this); };
DailyRenderer.prototype = new BaseRenderer();
DailyRenderer.prototype.constructor = DailyRenderer;
DailyRenderer.prototype.name = 'DailyRenderer';
DailyRenderer.prototype.dateRegexp = /([0-9]{4})\-([0-9]{2})\-([0-9]{2}) ([0-9]{2}):([0-9]{2})/;
DailyRenderer.prototype.getDateAndHour = function (dateString) {
	var m = this.dateRegexp.exec(dateString);
	return { 'year': m[1], 'month': m[2], 'day': m[3], 'hour': m[4]	};
}; 

DailyRenderer.prototype.sortLinks = function (links) {
  this.sortedLinks = new PutArray();
  
  for (var n = 0; n < links.length; n++) {
	if (links[n].visible) {
		var date = this.getDateAndHour(links[n].date);
		this.sortedLinks.get(date.year).get(date.month).get(date.day).get(date.hour).store(links[n]);
	}
  }
};

DailyRenderer.prototype.genHtml = function () {
  var html = '';
  var years = this.sortedLinks.getKeys();
  for (var yNum = years.length-1; yNum >= 0; yNum--) {
	var year = years[yNum];
	var months = this.sortedLinks.get(year).getKeys();
	for (var mNum = months.length-1; mNum >= 0; mNum--) {
		var month = months[mNum];
		var days = this.sortedLinks.get(year).get(month).getKeys();
		for (var dNum = days.length-1; dNum >= 0; dNum--) {
			var day = days[dNum];
			html += '<div class="day-div"><span class="day-header">'+day+'.'+month+'.'+year+'</span><br/>';
			var hours = this.sortedLinks.get(year).get(month).get(day).getKeys();
			for (var hNum = 0; hNum < hours.length; hNum++) {
				var hour = hours[hNum];
				html += '<div class="hour-div"><span class="hour-header">'+hour+':00</span><br/>';
				var links = this.sortedLinks.get(year).get(month).get(day).get(hour);
				for (var lNum = 0; lNum < links.length(); lNum++) {
					var link = links.getValue(lNum);
					html += '<div><span class="link-comment">'+link.comment+'</span>';
					if (link.url.length > 0) {
						html += ' <a href="'+link.url+'"><span class="link-url">['+link.urlText+']</span></a>'
					}
					html += '</div>';
				}
				html += '</div>';
			}		
			html += '</div>';
		}
	}
  }
  return html;
};

DailyRenderer.prototype.render = function (links) {
  this.clearArea();  
  this.sortLinks(links);
  this.getRenderArea().html(this.genHtml());
};

function TableDailyRenderer () { DailyRenderer.call(this); };
TableDailyRenderer.prototype = new DailyRenderer();
TableDailyRenderer.prototype.constructor = TableDailyRenderer;
TableDailyRenderer.prototype.name = 'TableDailyRenderer';
TableDailyRenderer.prototype.genHtml = function () {



	return "<table border><tr><td>"+this.sortedLinks.getKeys()[0]+"</td></tr></table>";
};

Links.prototype.linkRenderers = [new DailyRenderer(), new TableDailyRenderer(), new SimpleRenderer()];

Links.prototype.renderLinks = function () {
  this.linkRenderers[this.currentLinkRenderer].render(this.links);
};

Links.prototype.getRendererNames = function () {
	var names = [];
	for (var n = 0; n < this.linkRenderers.length; n++) {
		names[n] = this.linkRenderers[n].name;
	}
	return names;
};

Links.prototype.setCurrentLinkRenderer = function (num) {
	/*if (num < 0)
		num = 0;
	else if (num > this.linkRenderers.length -1)
		num = this.linkRenderers.length-1;*/
	this.currentLinkRenderer = num;	
};
