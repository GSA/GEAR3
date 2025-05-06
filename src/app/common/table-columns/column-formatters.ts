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