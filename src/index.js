console.log("Hello World!");
import * as yup from 'yup';
import axios from 'axios';

const input = document.getElementById('url-input');
console.log('input:', input);
const validUrl = yup.string().url();
console.log('validUrl:', validUrl);
const valid = validUrl.validate('https://lorem-rss.hexlet.app/feed');
console.log('valid:', valid);


const form = document.querySelector('.rss-form')
const formData = new FormData(form);
console.log('get:', formData.get('name'));
console.log('has:', formData.has('name'));

// const logOfValidUrl = validUrl.validateSync('hps://lorem-rss.hexlet.app/feed');
// console.log('logOfValidUrl:', logOfValidUrl);

form.addEventListener('submit', (e) => {
  e.predefault();
  console.log('click');
  const formData = new FormData(form);
  // if()
  const input = formData.get('url');
  console.log(input);
  if(validUrl.validate(input)) {
    console.log('if:', validUrl.validate(input));
    
    return;
  }
  console.log('else:', input.style.border);

  return input.style.border = '1px solid red';
});