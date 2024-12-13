import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import _ from 'lodash';
import fetchRSS from './fetchRSS.js';
import parseRSS from './parseRSS.js';
import initI18n from './i18n.js';
import { initView, renderPosts } from './view.js';

const app = () => {
  initI18n().then((i18nInstance) => {
    yup.setLocale({
      string: {
        url: i18nInstance.t('feedback.invalidUrl'),
      },
      mixed: {
        required: i18nInstance.t('feedback.notEmpty'),
        notOneOf: i18nInstance.t('feedback.alreadyExists'),
      },
    });

    const state = {
      feeds: [],
      posts: [],
      form: {
        url: '',
        valid: true,
        error: null,
        successMessage: null,
        loading: false, // Новое состояние формы
      },
      uiState: {
        visitedPosts: [],
        modal: {},
      },
      lastChecked: {},
    };

    const watchedState = initView(state, i18nInstance);

    const typeError = (error) => {
      if (error.name === 'ValidationError') {
        if (error.errors.includes(i18nInstance.t('feedback.notEmpty'))) {
          return 'feedback.notEmpty';
        }
        if (error.errors.includes(i18nInstance.t('feedback.alreadyExists'))) {
          return 'feedback.alreadyExists';
        }
        if (error.errors.includes(i18nInstance.t('feedback.invalidUrl'))) {
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

    const getSchema = () => yup.object().shape({
      url: yup.string().url().required().notOneOf(state.feeds.map((feed) => feed.url)),
    });

    const form = document.querySelector('.rss-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url').trim();
      watchedState.form.url = url;

      const schema = getSchema();

      watchedState.form.loading = true; // Начало загрузки
      schema
        .validate({ url })
        .then(() => fetchRSS(url))
        .then((rssData) => {
          const { feed, posts } = parseRSS(rssData);
          const feedId = _.uniqueId();

          watchedState.form = {
            error: null,
            successMessage: i18nInstance.t('feedback.success'),
            url: '',
            valid: true,
            loading: false, // Завершение загрузки
          };

          watchedState.feeds.push({ ...feed, id: feedId, url });

          if (!state.lastChecked[url]) {
            state.lastChecked[url] = new Date();
          }

          const newPosts = posts.map((post) => ({ ...post, id: _.uniqueId(), feedId }));
          watchedState.posts.push(...newPosts);
        })
        .catch((error) => {
          watchedState.form = {
            error: i18nInstance.t(typeError(error)),
            successMessage: null,
            url: watchedState.form.url,
            valid: false,
            loading: false, // Завершение загрузки с ошибкой
          };
        });
    });

    const postsContainer = document.querySelector('.posts');
    postsContainer.addEventListener('click', (e) => {
      const postId = e.target.dataset.id;
      if (!postId) return;

      const post = watchedState.posts.find((p) => p.id === postId);
      if (!post) return;

      watchedState.uiState.modal = {
        title: post.title,
        description: post.description,
        link: post.link,
      };

      if (!watchedState.uiState.visitedPosts.includes(post.id)) {
        watchedState.uiState.visitedPosts = [...watchedState.uiState.visitedPosts, post.id];
        renderPosts(watchedState.posts, watchedState);
      }

      if (e.target.tagName === 'BUTTON') {
        const modalElement = document.querySelector('#modal');
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
      }
    });

    const startUpdateChecking = async () => {
      const checkUpdatesForFeed = async (feed) => {
        try {
          const rssData = await fetchRSS(feed.url);
          const { posts } = parseRSS(rssData);

          const lastChecked = state.lastChecked[feed.url]
            ? new Date(state.lastChecked[feed.url])
            : new Date(0);

          const newPosts = posts.filter((post) => {
            const postDate = new Date(post.pubDate).getTime();
            const isNew = postDate > lastChecked.getTime();
            return isNew;
          });

          if (newPosts.length > 0) {
            // Добавляем новые посты в состояние
            newPosts.forEach((post) => {
              watchedState.posts.push({ ...post, id: _.uniqueId(), feedId: feed.id });
            });

            state.lastChecked[feed.url] = new Date();
            renderPosts(watchedState.posts, watchedState);
          }
        } catch (error) {
          console.error(`Error fetching updates for feed ${feed.url}:`, error);
        }
      };

      const updatePromises = watchedState.feeds.map(checkUpdatesForFeed);
      await Promise.all(updatePromises); // Ждем завершения всех обновлений

      setTimeout(startUpdateChecking, 5000);
    };

    startUpdateChecking();
  });
};

export default app;