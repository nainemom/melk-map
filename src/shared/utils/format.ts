export const toEnglishDigits = (str?: string) =>
  (str ?? '')
    .toString()
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 1776 + 48)
    );