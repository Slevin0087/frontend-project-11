export default (data) => {
  console.log('click parse');
  
  const newDOMparserObj = new DOMParser();
  console.log('click parse newDOMparserObj:', newDOMparserObj);
  const parserData = newDOMparserObj.parseFromString(data, 'application/xml');
  console.log('click parse parserData:', parserData);

  const parseError = parserData.querySelector('parsererror');
  console.log('click parse parseError:', parseError);
  if (parseError) {
    throw new Error('rssParsingError');
  }
  const channel = parserData.querySelector('channel');
  const feedTitle = channel.querySelector('title').textContent;
  const feedDescription = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  return {
    feeds: {
      title: feedTitle,
      description: feedDescription,
    },
    posts: items,
  };
};
