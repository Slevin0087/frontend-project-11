export default (data) => {  
  const newDOMparserObj = new DOMParser();
  const parserData = newDOMparserObj.parseFromString(data, 'application/xml');
  const parseError = parserData.querySelector('parsererror');
  if (parseError) {
    throw new Error('rssParsingError');
  }
  const channel = parserData.querySelector('channel');
  const feedTitle = channel.querySelector('title').textContent;
  const feedDescription = channel.querySelector('description').textContent;
  const items = [...parserData.querySelectorAll('item')].map((item) => ({
    title: item.querySelector('title').textContent,
    link: item.querySelector('link').textContent,
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
  }));
  return {
    feed: {
      title: feedTitle,
      description: feedDescription,
    },
    posts: items,
  };
};
