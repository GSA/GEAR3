
const formatDateTime = (dateObj) => {
    // - description: formats the date and time for logging
    // - parameters: dateObj (date object)
    // - returns: formattedDate (string) 'yyyy-mm-dd hh:mm:ss.mmm' or null
    if (dateObj === null || dateObj === '') {
        return null;
    } else {

        let formattedDate = new Date(dateObj);

        if (formattedDate === null || formattedDate === '') {
            return null;
        } else {
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
        }
    }
};

module.exports = {
    formatDateTime,
};