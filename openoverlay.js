(function($) {
	$.fn.openOverlay = function(options) {
		debug(this);
		if (options === 'close'){
			$.fn.openOverlay.closeOverlay();
			return
		}
 
		// build main options before element iteration
		var opts = $.extend({}, $.fn.openOverlay.defaults, options);
		if (!$('#overlayLayer').length){
			var w = $(window);
			var h = w.height();
			var w = w.width();
			var docbody = $(document.body);  
			if (!h) h=10000;
			docbody.append(
				'<div id="overlayLayer" style="'+
				'text-align:center; z-index:1000; position:absolute; top:0px; bottom:0px; left:0px; right:0px;'+
				'opacity: 0.'+opts.iOpacity+';'+
				'-ms-filter:progid:DXImageTransform.Microsoft.Alpha(Opacity='+opts.iOpacity+');'+ 
				'filter: alpha(opacity='+opts.iOpacity+');'+
				'background:'+opts.sColor+';'+
				'height:'+h+'px"></div>'); 
			fillrUp();
			$(window)
				.scroll(fillrUp)
				.resize(fillrUp);
			docbody.append('<div id="overlayContentContainer" style="float:left;  position:absolute; top:0; left:0;"></div>');
 
		}
		var occ = $('#overlayContentContainer');
		// append each matched element to the overlayContentContainer
		var iLength = this.length;
		return this.each(function(i) {
			occ.append(this);
			if (i===iLength-1) positionOverlayContent();
 
		});
	};
 
	// private functions
 
	function positionOverlayContent(){
		var o = $('#overlayContentContainer');
		var h = $(window).height();
		var w = $(window).width();
		//alert(h);
		if(!h) h=300;
		o.css({
			marginTop: h/2 - o.outerHeight()/2 + $(window).scrollTop() + 'px',
			marginLeft: w/2  - o.outerWidth()/2 + $(window).scrollLeft()+'px',
			left:'0',
			position:'absolute',
			zIndex:'1001'
		})
	}
	function fillrUp(){
		var h = $(window).height();
		var w = $(window).width();
		if (h){
			$('#overlayLayer').height(h + $(window).scrollTop());
			$('#overlayLayer').width(w+$(window).scrollLeft());
		}else{
			window.$('#overlayLayer').css({
				top:$(window).scrollTop()+'px',
				left:$(window).scrollLeft()+'px'
			});
		}
		positionOverlayContent()
	}
 
	function debug($obj) {
		if (window.console && window.console.log)
			window.console.log('openoverlay selection count: ' + $obj.size());
	};
	// define and expose public  functions
 
	$.fn.openOverlay.closeOverlay = function(){
		$(window)
			.unbind('scroll',fillrUp)
			.unbind('resize',fillrUp);
			$('#overlayLayer,#overlayContentContainer').fadeOut('slow',function(){
				$(this).remove();
			});
	}
 
	// plugin defaults
	$.fn.openOverlay.defaults = {
			iOpacity:60,
			sColor:'#444444'
	};
	//end of closure
})(jQuery);