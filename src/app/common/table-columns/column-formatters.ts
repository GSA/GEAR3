export function dateFormatter(value: any) {
    const date = new Date(value);
    if (value) {
        return date.toLocaleDateString();
    } else {
        return '-';
    }
};

export function emailFormatter(value: any) {
    return `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${value}" target="_blank" rel="noopener">${value}</a>`;
};

export function linksFormatter(value: any) {
    if (value) return `<a target="_blank" rel="noopener" href="${value}">Link</a>`;
};

export function formatDescription(value: any) {
    if (!value) return '';
    else return '<span class="description-wrap">' + value + "</span>";
};

export function formatDescriptionLite(value: any) {
    if (!value) return '-';
    else return '<span class="description-wrap-lite">' + value + "</span>";
};

export function pocStringNameFormatter(value: any) {
    let names = [];
    let pocs = value.split(':')[1];  // Retrieve POC after colon
    pocs = pocs.split('; ');  // Retrieve POC after colon
    for (let i = 0; i < pocs.length; i++) {
      let singleName = pocs[i].split(', ')[0];
      if (singleName != '') names.push(singleName);  // Add only if there is a name
    }

    if (names.length === 0) return null;
    else return names.join(', ');
};