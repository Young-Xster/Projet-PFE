const payload = { startDate: '', endDate: '', paymentType: 'FIXED', amount: '' };
console.log(payload);
// How does formData convert it?
// In browser FormData, appending '' results in sending '' as the value.
