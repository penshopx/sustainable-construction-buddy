const html2pdf = () => ({
  from: () => ({ save: () => Promise.resolve(), output: () => Promise.resolve("") }),
  set: () => ({ from: () => ({ save: () => Promise.resolve() }) }),
});
export default html2pdf;
