import './styles.scss';
import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import uniqueId from 'lodash/uniqueId.js';
import fetchRSS from './fetchRSS.js';
import i18nextInit from './i18next.js';
import parserResponse from './parserRSS.js';
import { renderFeedbackText, renderPosts, view } from './views.js';

const elements = {
  form: document.querySelector('.rss-form'),
  postsContainer: document.querySelector('.posts'),
};

function schema(arrUrls) {
  return yup.string().required().url().notOneOf(arrUrls);
}

function typeError(error, i18nextInstance) {
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
}

function app() {
  i18nextInit().then((i18nextInstance) => {
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

    const checkUpdatesForFeed = (feed) => {
      fetchRSS(feed.url)
        .then((data) => {
          const { posts } = parserResponse(data);

          const lastChecked = state.lastChecked[feed.url]
            ? new Date(state.lastChecked[feed.url])
            : new Date(0);

          const newPosts = posts.filter((post) => {
            const postDate = new Date(post.pubDate).getTime();
            const isNew = postDate > lastChecked.getTime();
            return isNew;
          });

          if (newPosts.length > 0) {
            newPosts.forEach((post) => {
              state.posts.unshift({
                ...post,
                id: uniqueId(),
                feedId: feed.id,
              });
            });

            state.lastChecked[feed.url] = new Date();
            renderPosts(state.posts, state);
          }
        })
        .catch((error) => {
          console.error(`Error fetching updates for feed ${feed.url}:`, error);
        });
    };
    const startUpdateChecking = () => {
      const updatePromises = state.feeds.map(checkUpdatesForFeed);
      Promise.all(updatePromises)
        .then(() => setTimeout(startUpdateChecking, 5000));
    };

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedForm.form.process = 'processing';
      const formData = new FormData(e.target);
      const url = formData.get('url').trim();
      schema(state.form.url)
        .validate(url)
        .then(() => fetchRSS(url))
        .then((data) => {
          const { feed, posts } = parserResponse(data);
          const feedId = uniqueId();
          state.feeds.push({ ...feed, id: feedId, url });

          if (!state.lastChecked[url]) {
            state.lastChecked[url] = new Date();
          }
          const newPosts = posts.map((post) => ({
            ...post,
            id: uniqueId(),
            feedId,
          }));

          state.posts.push(...newPosts);
          state.form.url.push(url);
          watchedForm.form.process = 'processed';
          const successText = i18nextInstance.t('feedback.success');
          renderFeedbackText(successText);
        })
        .then(() => startUpdateChecking())
        .catch((error) => {
          watchedForm.form.process = 'failed';
          const errorText = i18nextInstance.t(
            typeError(error, i18nextInstance),
          );
          switch (errorText) {
            case i18nextInstance.t('feedback.invalidUrl'):
              return renderFeedbackText(errorText);
            case i18nextInstance.t('feedback.alreadyExists'):
              return renderFeedbackText(errorText);
            case i18nextInstance.t('feedback.rssParsingError'):
              return renderFeedbackText(errorText);
            case i18nextInstance.t('feedback.networkError'):
              return renderFeedbackText(errorText);
            default:
              throw new Error(error);
          }
        });
    });
    elements.postsContainer.addEventListener('click', (e) => {
      const postId = e.target.dataset.id;
      if (!postId) return;
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return;
      watchedForm.uiState.modal = {
        title: post.title,
        description: post.description,
        link: post.link,
      };
      if (!state.uiState.visitedPosts.includes(post.id)) {
        state.uiState.visitedPosts = [...state.uiState.visitedPosts, post.id];
        renderPosts(state.posts, state);
      }
      if (e.target.tagName === 'BUTTON') {
        const modal = document.querySelector('#modal');
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
      }
    });
  });
}

export default app;
