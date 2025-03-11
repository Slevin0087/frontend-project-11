import onChange from "on-change";

const domElements = {
  btn: document.querySelector('button[type="submit"]'),
  input: document.getElementById("url-input"),
  feedback: document.querySelector(".feedback"),
  postsElement: document.querySelector(".posts"),
  feedsElement: document.querySelector(".feeds"),
};

function renderProcessing() {
  domElements.btn.disabled = true;
  domElements.input.readOnly = true;
}

function renderFailed() {
  domElements.feedback.classList.add("text-danger");
  domElements.feedback.classList.remove("text-success");
  domElements.input.style.borderColor = "red";
  domElements.input.readOnly = false;
  domElements.btn.disabled = false;
}

function renderProcessed() {
  domElements.feedback.classList.remove("text-danger");
  domElements.feedback.classList.add("text-success");
  domElements.input.value = "";
  domElements.input.style.borderColor = "";
  domElements.btn.disabled = false;
  domElements.input.readOnly = false;
  domElements.input.focus();
}

function renderModal(m) {
  // const a = domElements.postsElement.querySelector(`[data-id="${m.id}"]`);
  const modal = document.querySelector("#modal");
  const modalTitle = modal.querySelector(".modal-title");
  const modalBody = modal.querySelector(".modal-body");
  const modalLink = modal.querySelector(".full-article");
  // a.classList.remove("fw-bold");
  // a.classList.add("fw-normal");

  modalTitle.textContent = m.title;
  modalBody.textContent = m.description;
  modalLink.href = m.link;
}

function renderFeedbackText(text) {
  domElements.feedback.textContent = "";
  domElements.feedback.textContent = text;
}

function renderFeeds(feeds) {
  domElements.feedsElement.innerHTML = "";
  const div = document.createElement("div");
  const divTitle = document.createElement("div");
  const h2 = document.createElement("h2");
  const ul = document.createElement("ul");
  const h3 = document.createElement("h3");
  const p = document.createElement("p");

  div.classList.add("card", "border-0");
  divTitle.classList.add("card-body");
  h2.classList.add("card-title", "h4");
  ul.classList.add("list-group", "border-0", "rounded-0");
  h3.classList.add("h6", "m-0");
  p.classList.add("m-0", "small", "text-black-50");

  divTitle.append(h2);
  div.append(divTitle, ul);

  const li = document.createElement("li");
  li.classList.add("list-group-item", "border-0", "border-end-0");
  h2.textContent = "Фиды";
  feeds.forEach((feed) => {
    h3.textContent = feed.title;
    p.textContent = feed.description;
  });
  li.append(h3, p);
  ul.append(li);
  domElements.feedsElement.append(div);
}

function renderPosts(posts, state) {
  domElements.postsElement.innerHTML = "";
  const div = document.createElement("div");
  const divTitle = document.createElement("div");
  const h2 = document.createElement("h2");
  const ul = document.createElement("ul");
  const h3 = document.createElement("h3");
  const p = document.createElement("p");

  div.classList.add("card", "border-0");
  divTitle.classList.add("card-body");
  h2.classList.add("card-title", "h4");
  ul.classList.add("list-group", "border-0", "rounded-0");
  h3.classList.add("h6", "m-0");
  p.classList.add("m-0", "small", "text-black-50");

  divTitle.append(h2);
  div.append(divTitle, ul);

  h2.textContent = "Посты";
  posts.forEach((post) => {
    const { id, title, link } = post;
    const a = document.createElement("a");
    const button = document.createElement("button");
    const li = document.createElement("li");
    a.href = link;
    a.textContent = title;
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    a.setAttribute("data-id", `${id}`);
    button.textContent = "Просмотр";
    button.setAttribute("type", "button");
    button.setAttribute("data-bs-toggle", "modal");
    button.setAttribute("data-bs-target", "#modal");
    button.setAttribute("data-id", `${id}`);
    button.classList.add("btn", "btn-outline-primary", "btn-sm");
    a.classList.toggle('fw-bold', !state.uiState.visitedPosts.includes(post.id));
    a.classList.toggle('fw-normal', state.uiState.visitedPosts.includes(post.id));
    // a.classList.add("fw-bold");
    li.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-start",
      "border-0",
      "border-end-0"
    );

    li.append(a, button);
    ul.append(li);
  });
  domElements.postsElement.append(div);
}

function view(state) {
  const watchedForm = onChange(state, (path, value) => {
    switch (path) {
      case "form.process":
        switch (value) {
          case "processing":
            renderProcessing();
            break;
          case "failed":
            renderFailed();
            break;
          case "processed":
            renderProcessed();
            renderFeeds(state.feeds);
            renderPosts(state.posts, state);
            break;
          default:
            throw new Error(
              "Ошибка view(неверное value - статус состояния формы)"
            );
        }
        break;
      case "uiState.modal":
        renderModal(state.uiState.modal);
        break;
      default:
        throw new Error("Ошибка view(неверный path)");
    }
  });
  return watchedForm;
}

export { renderFeedbackText, renderPosts, view };
