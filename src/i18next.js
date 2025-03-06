import i18next from 'i18next';
import ru from './locales/ru.js';

export default () => {
  const i18nInstance = i18next.createInstance(); // Новый экземпляр i18next

  return i18nInstance
    .init({
      resources: {
        ru,
      },
      lng: 'ru', // Язык по умолчанию
      fallbackLng: 'ru', // Язык по умолчанию, если выбранный не доступен
      debug: false,
      interpolation: {
        escapeValue: true,
      },
    })
    .then(() => i18nInstance);
};
