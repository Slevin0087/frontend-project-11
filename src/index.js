console.log("Hello World!");
import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import axios from 'axios';
import onChange from 'on-change';
import i18nextInit from './i18next';

const form = document.querySelector('.rss-form');
const btn = document.querySelector('button[type="submit"]');
const input = document.getElementById('url-input');
const feedback = document.querySelector('.feedback');

function renderText(feedbackElement, text) {
  feedbackElement.textContent = '';
  feedbackElement.textContent = text;
};

const state = {
  formFeeds: {
    process: 'filling',
    arrUrls: [],
  }
};

const watchedUrlValid = onChange(state, (path, value) => {
  switch (path) {
    case 'formFeeds.process':
      switch (value) {
        case 'processing':
          console.log('case1');
          btn.disabled = true;
          input.readOnly = true;
          break;
        case 'failed':
          console.log('case2');
          input.style.borderColor = 'red';
          input.readOnly = false;
          btn.disabled = false;
          break;
        case 'processed':
          console.log('case3');
          input.value = '';
          input.style.borderColor = '';
          btn.disabled = false;
          input.readOnly = false;
          input.focus();
          break;
        default:
          throw new Error('Ошибка view(неверное value - статус состояния формы)');
      }
      break;
    default:
      throw new Error('Ошибка view(неверный path - путь до состояния формы)')
  }
});

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

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedUrlValid.formFeeds.process = 'processing';
        const formData = new FormData(e.target);
        const url = formData.get('url').trim();
        (function schema() {
          return yup.string().required().url().notOneOf(state.formFeeds.arrUrls);
        })()
          .validate(url)
          .then((url) => {
            state.formFeeds.arrUrls.push(url);
            watchedUrlValid.formFeeds.process = 'processed';
            const successText = i18nextInstance.t('feedback.success');
            renderText(feedback, successText);
          })
          .catch((error) => {
            console.log('catch');
            watchedUrlValid.formFeeds.process = 'failed';
            const errorText = i18nextInstance.t(typeError(error));
            switch (errorText) {
              case i18nextInstance.t('feedback.invalidUrl'):
                return renderText(feedback, errorText);
              case i18nextInstance.t('feedback.alreadyExists'):
                return renderText(feedback, errorText);
              default:
                throw new Error(errorText);
            }
          })
      });
    })
};

app();