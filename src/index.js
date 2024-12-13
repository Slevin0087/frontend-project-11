console.log("Hello World!");
import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import axios from 'axios';
import i18nextInit from './i18next';
import { renderText, view } from './views';

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
        formFeeds: {
          process: 'filling',
          arrUrls: [],
        }
      };

      const watchedForm = view(state);
 
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

      const feedback = document.querySelector('.feedback');
      const form = document.querySelector('.rss-form');

      form.addEventListener('submit', (e) => {
        console.log('submit');
        e.preventDefault();
        watchedForm.formFeeds.process = 'processing';
        const formData = new FormData(e.target);
        const url = formData.get('url').trim();
        (function schema() {
          return yup.string().required().url().notOneOf(state.formFeeds.arrUrls);
        })()
          .validate(url)
          .then((url) => {
            state.formFeeds.arrUrls.push(url);
            watchedForm.formFeeds.process = 'processed';
            const successText = i18nextInstance.t('feedback.success');
            renderText(feedback, successText);
          })
          .catch((error) => {
            console.log('catch');
            watchedForm.formFeeds.process = 'failed';
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