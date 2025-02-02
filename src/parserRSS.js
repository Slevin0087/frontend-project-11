export function parserResponse(data) {

  const newDOMparserObj = new DOMParser();
  const parserData = newDOMparserObj.parseFromString(data, 'application/xml');
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
