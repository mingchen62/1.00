

Date.prototype.getWeek = function(timestamp) {
  var date = new Date(timestamp*1000);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Returns the four-digit year corresponding to the ISO week of the date.
Date.prototype.getWeekYear = function(timestamp) {
  var date = new Date(timestamp*1000);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  var year = date.getFullYear();
  var week1 = new Date(date.getFullYear(), 0, 4);
  var week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
  return year +"_"+week
}

console.log( "1519516800 " + Date.prototype.getWeekYear(1519516800))
console.log( "1519603200 " + Date.prototype.getWeekYear(1519603200))
