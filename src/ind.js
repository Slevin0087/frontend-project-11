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


function appI() {
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
        }
  
        const form = document.querySelector('.rss-form');
        const postsContainer = document.querySelector('.posts');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          watchedForm.form.process = 'processing';
          const formData = new FormData(e.target);
          const url = formData.get('url').trim();
          schema(state.form.url)
            .validate(url)
            .then(() => state.form.url.push(url))
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
                    };
                    renderNewPost(getProperties);
                  })
                  .then(() => {
                    setTimeout(addNewPost, 5000);
                  });
              }
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
                case i18nextInstance.t('feedback.rssParsingError'):
                  return renderFeedbackText(errorText);
                case i18nextInstance.t('feedback.networkError'):
                  return renderFeedbackText(errorText);
                default:
                  throw new Error(error);
              }
            });
        });
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
      });
  }