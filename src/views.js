import onChange from 'on-change';

const submitBtn = document.querySelector('button[type="submit"]');
const urlInput = document.getElementById('url-input');

export function renderText(feedbackElement, text) {
  feedbackElement.textContent = '';
  feedbackElement.textContent = text;
};

export function view(state) {
  const watchedForm = onChange(state, (path, value) => {
    switch (path) {
      case 'formFeeds.process':
        switch (value) {
          case 'processing':
            console.log('case1');
            submitBtn.disabled = true;
            urlInput.readOnly = true;
            break;
          case 'failed':
            console.log('case2');
            urlInput.style.borderColor = 'red';
            urlInput.readOnly = false;
            submitBtn.disabled = false;
            break;
          case 'processed':
            console.log('case3');
            urlInput.value = '';
            urlInput.style.borderColor = '';
            submitBtn.disabled = false;
            urlInput.readOnly = false;
            urlInput.focus();
            break;
          default:
            throw new Error('Ошибка view(неверное value - статус состояния формы)');
        }
        break;
      default:
        throw new Error('Ошибка view(неверный path - путь до состояния формы)')
    }
  });
  return watchedForm;
};