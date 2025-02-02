import './styles.scss';
import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import fetchRSS from './fetchRSS';
import i18nextInit from './i18next';
import { parserResponse } from './parserRSS';
import { renderFeedbackText, view, renderNewPost } from './views';
import uniqueId from 'lodash/uniqueId.js';

function createFeedsAndPostsData(state, feeds, posts) {
  state.feeds.push({
    id: 1,
    title: feeds.title,
    description: feeds.description
  });
  posts.forEach(item => {
    const titlePost = item.querySelector('title').textContent;
    const descriptionPost = item.querySelector('description').textContent;
    const linkPost = item.querySelector('link').textContent;
    const pubDate = item.querySelector('pubDate').textContent;
    state.posts.push({
      id: uniqueId(),
      title: titlePost,
      description: descriptionPost,
      link: linkPost,
      pubDate: pubDate,
    });
  })
};

function app() {

  i18nextInit()
    .then((i18nextInstance) => {
      yup.setLocale({
        mixed: {
          default: i18nextInstance.t('feedback.unknownError'),
          required: i18nextInstance.t('feedback.notEmpty'),
          notOneOf: i18nextInstance.t('feedback.alreadyExists'),
        },
        string: {
          url: i18nextInstance.t('feedback.invalidUrl'),
        },
      });

      const state = {
        form: {
          url: [],
          process: 'filling',
        },
        feeds: [],
        posts: [],
        uiState: {
          visitedPosts: [],
          modal: {},
        },
        lastChecked: {},
      };

      const watchedForm = view(state);

      function schema(arrUrls) {
        return yup.string().required().url().notOneOf(arrUrls);
      }

      function typeError(error) {
        if (error.name === 'ValidationError') {
          if (error.errors.includes(i18nextInstance.t('feedback.notEmpty'))) {
            return 'feedback.notEmpty';
          }
          if (error.errors.includes(i18nextInstance.t('feedback.alreadyExists'))) {
            return 'feedback.alreadyExists';
          }
          if (error.errors.includes(i18nextInstance.t('feedback.invalidUrl'))) {
            return 'feedback.invalidUrl';
          }
        }
        if (error.message === 'rssParsingError') {
          return 'feedback.rssParsingError';
        }
        if (error.message === 'networkError') {
          return 'feedback.networkError';
        }
        return 'feedback.unknownError';
      };

      const form = document.querySelector('.rss-form');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedForm.form.process = 'processing';
        const formData = new FormData(e.target);
        const url = formData.get('url').trim();
        schema(state.form.url)
          .validate(url)
          .then(() => state.form.url.push(url)
          )
          .then(() => fetchRSS(url))
          .then((data) => {
            const { feeds, posts } = parserResponse(data);
            createFeedsAndPostsData(state, feeds, posts);
          })
          .then(() => {
            watchedForm.form.process = 'processed';
            const successText = i18nextInstance.t('feedback.success');
            renderFeedbackText(successText);
            state.lastChecked = state.posts[0].pubDate;
          })
          .then(() => {
            const postsContainer = document.querySelector('.posts');
            postsContainer.addEventListener('click', (e) => {
              const postId = e.target.dataset.id;             
              if (!postId) return;
              const post = state.posts.find((p) => p.id === postId);
              if (!post) return;
              watchedForm.uiState.modal = {
                id: post.id,
                title: post.title,
                description: post.description,
                link: post.link,
              };
              if (!state.uiState.visitedPosts.includes(post.id)) {
                state.uiState.visitedPosts = [...state.uiState.visitedPosts, post.id];
              }

              if (e.target.tagName === 'BUTTON') {
                const modal = document.querySelector('#modal');
                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
              }

            });
            function addNewPost() {
              const timeLastPost = new Date(state.lastChecked);
              fetchRSS(url)
                .then((data) => {
                  const { posts } = parserResponse(data);
                  const post = posts[0];
                  const newPubDate = post.querySelector('pubDate').textContent;
                  const timeNewPubpost = new Date(newPubDate);
                  const itsMore = timeNewPubpost > timeLastPost;
                  if (!itsMore) return;
                  state.lastChecked = newPubDate;
                  const getProperties = {
                    id: uniqueId(),
                    title: post.querySelector('title').textContent,
                    link: post.querySelector('link').textContent,
                  }
                  renderNewPost(getProperties);
                })
                .then(() => {
                  setTimeout(addNewPost, 5000);
                })
            };
            addNewPost();
          })
          .catch((error) => {
            watchedForm.form.process = 'failed';
            const errorText = i18nextInstance.t(typeError(error));
            switch (errorText) {
              case i18nextInstance.t('feedback.invalidUrl'):
                return renderFeedbackText(errorText);
              case i18nextInstance.t('feedback.alreadyExists'):
                return renderFeedbackText(errorText);
              default:
                throw new Error(error);
            }
          })
      });
    })
};

export default app;