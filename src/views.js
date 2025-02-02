import onChange from 'on-change';

const submitBtn = document.querySelector('button[type="submit"]');
const urlInput = document.getElementById('url-input');
const postsElement = document.querySelector('.posts');
const feedsElement = document.querySelector('.feeds');
const feedback = document.querySelector('.feedback');

function renderNewPost(properties) {
  const getUl = postsElement.querySelector('ul');
  const {
    id,
    title,
    link,
  } = properties;

  console.log('getUl:', getUl);
  const a = document.createElement('a');
  const button = document.createElement('button');
  const li = document.createElement('li');
  a.href = link;
  a.textContent = title;
  button.textContent = 'Просмотр';
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  a.setAttribute('data-id', `${id}`);
  button.setAttribute('type', 'button');
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');
  button.setAttribute('data-id', `${id}`);
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  a.classList.add('fw-bold');
  li.classList.add(
    'list-group-item', 'd-flex', 'justify-content-between',
    'align-items-start', 'border-0', 'border-end-0'
  );

  li.append(a, button);
  getUl.prepend(li);
}

function renderProcessing(btn, input) {
  btn.disabled = true;
  input.readOnly = true;
};

function renderFailed(btn, input) {
  feedback.classList.add('text-danger');
  feedback.classList.remove('text-success');
  input.style.borderColor = 'red';
  input.readOnly = false;
  btn.disabled = false;
};

function renderProcessed(btn, input) {
  feedback.classList.remove('text-danger');
  feedback.classList.add('text-success');
  input.value = '';
  input.style.borderColor = '';
  btn.disabled = false;
  input.readOnly = false;
  input.focus();
};

function renderModal (m) {
  const a = postsElement.querySelector(`[data-id="${m.id}"]`);  
  const modal = document.querySelector('#modal');
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  const modalLink = modal.querySelector('.full-article');
  a.classList.remove('fw-bold');
  a.classList.add('fw-normal');

  modalTitle.textContent = m.title;
  modalBody.textContent = m.description;
  modalLink.href = m.link;
};

export function renderFeedbackText(text) {
  feedback.textContent = '';
  feedback.textContent = text;
};

function renderFeedsAndPosts(titleText, state) {

  const div = document.createElement('div');
  const divTitle = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  const h3 = document.createElement('h3');
  const p = document.createElement('p');

  div.classList.add('card', 'border-0');
  divTitle.classList.add('card-body');
  h2.classList.add('card-title', 'h4');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  h3.classList.add('h6', 'm-0');
  p.classList.add('m-0', 'small', 'text-black-50');

  divTitle.append(h2);
  div.append(divTitle, ul);

  if (titleText === 'Фиды') {
    feedsElement.textContent = '';
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    h2.textContent = titleText;
    state.feeds.forEach(feed => {
      h3.textContent = feed.title;
      p.textContent = feed.description;
    })
    li.append(h3, p);
    ul.append(li);
    feedsElement.append(div);
  };

  if (titleText === 'Посты') {
    postsElement.text = '';
    h2.textContent = titleText;
    state.posts.forEach(post => {
      const {
        id,
        title,
        link,
      } = post;
      const a = document.createElement('a');
      const button = document.createElement('button');
      const li = document.createElement('li');
      a.href = link;
      a.textContent = title;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('data-id', `${id}`);
      button.textContent = 'Просмотр';
      button.setAttribute('type', 'button');
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.setAttribute('data-id', `${id}`);
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      a.classList.add('fw-bold');
      li.classList.add(
        'list-group-item', 'd-flex', 'justify-content-between',
        'align-items-start', 'border-0', 'border-end-0'
      );

      li.append(a, button);
      ul.append(li);
    });
    postsElement.append(div);
  }
}

export function view(state) {
  const watchedForm = onChange(state, (path, value) => {

    switch (path) {
      case 'form.process':
        switch (value) {
          case 'processing':
            renderProcessing(submitBtn, urlInput);
            break;
          case 'failed':
            renderFailed(submitBtn, urlInput)
            break;
          case 'processed':
            renderProcessed(submitBtn, urlInput);
            feedsElement.innerHTML = '';
            postsElement.innerHTML = '';
            renderFeedsAndPosts('Фиды', state);
            renderFeedsAndPosts('Посты', state);
            break;
          default:
            throw new Error('Ошибка view(неверное value - статус состояния формы)');
        }
        break;
      case 'uiState.modal':
        renderModal(state.uiState.modal);
        break;
      default:
        throw new Error('Ошибка view(неверный path)')
    }
  });
  return watchedForm;
};

export { renderNewPost };