import moment from 'moment';

export function safeFormattedDate(date: string | undefined, defaultValue = undefined) {
  if (!date) { return defaultValue }
  return moment.utc(date).isValid() ? moment.utc(date).format() : defaultValue;
}

export function safeAndPrettyFormattedDate(date: string | number | undefined, convertToTimestamp = true) {
  if (!date) { return null }

  const timestamp = convertToTimestamp
    ? Math.floor(+new Date(date)/1000)
    : Math.floor(+date/1000);
    
	return timestamp > 0 && timestamp < (Math.pow(2, 31) -1)
    ? timestamp
    : null
}

export function earliestDate(date1: string | undefined, date2: string | undefined) {
  if (!date1 && !date2) { return; }
  if (!moment.utc(date1).isValid() && !moment.utc(date2).isValid()) { return; }
  if ((!date1 || !moment.utc(date1).isValid()) && moment.utc(date2).isValid()) { return moment.utc(date2).format(); }
  if ((!date2 || !moment.utc(date2).isValid()) && moment.utc(date1).isValid()) { return moment.utc(date1).format(); }
  return moment(date1).isBefore(date2) ? moment.utc(date1).format() : moment.utc(date2).format();  
}