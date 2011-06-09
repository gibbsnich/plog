require 'rubygems'
require 'sqlite3'

def open_db()
	db = SQLite3::Database.new('plog.sqlite')		
	yield db
	db.close
end

def collect_rows(db, stmt)
	arr = []
	db.execute(stmt) do |r| #first element is name of columns!
		arr << r
	end
	arr
end


open_db { |db|
	vals = collect_rows(db, 'select * from links')
	vals.each { |v|
		puts "Keep? [y/n]"
		puts "#{v.join("\n")}"
		keep = gets.strip
		db.execute("delete from links where pkey = #{v.first}") if keep =~ /^n/i
		puts ''
	}
}