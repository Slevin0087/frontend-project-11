import i18next from 'i18next';
import ru from './locales/ru.js';

export default () => {
  const i18nInstance = i18next.createInstance();

  return i18nInstance
    .init({
      resources: {
        ru,
      },
      lng: 'ru',
      fallbackLng: 'ru',
      debug: false,
      interpolation: {
        escapeValue: true,
      },
    })
    .then(() => i18nInstance);
};
