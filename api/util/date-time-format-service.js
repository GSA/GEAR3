
/**
 * Formats the date and time for logging.
 *
 * @param {Date|string} dateObj - The date object or date string to be formatted.
 * @returns {string|null} The formatted date string in 'yyyy-mm-dd hh:mm:ss.mmm' format or null if invalid.
 */
export const formatDateTime = (dateObj) => {
    if (dateObj === null || dateObj === '') {
      return null;
    }
  
    let formattedDate = new Date(dateObj);
    if (isNaN(formattedDate)) {
      return null;
    }
  
    // Get the individual date components
    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');
    
    // Get the individual time components
    const hours = String(formattedDate.getHours()).padStart(2, '0');
    const minutes = String(formattedDate.getMinutes()).padStart(2, '0');
    const seconds = String(formattedDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(formattedDate.getMilliseconds()).padStart(3, '0');
  
    // Combine the components into the desired format
    formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    return formattedDate;
  };