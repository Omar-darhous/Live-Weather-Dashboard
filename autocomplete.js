import {findCities} from './weather.js';

export function setupCitySearch({input, results, getKey, onSelect}) {
  let timer, controller, version = 0, active = -1, cities = [];
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', results.id);
  input.setAttribute('aria-expanded', 'false');
  results.setAttribute('role', 'listbox');
  input.closest('form').append(results);

  function close() {
    clearTimeout(timer);
    controller?.abort();
    version++;
    cities = [];
    active = -1;
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function message(text) {
    results.replaceChildren();
    const item = document.createElement('p');
    item.setAttribute('role', 'status');
    item.textContent = text;
    results.append(item);
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function select(city) {
    close();
    input.value = city.name;
    input.focus();
    onSelect(city);
  }

  async function search(query) {
    close();
    query = query.trim();
    if (query.length < 2) return;
    const current = version;
    controller = new AbortController();
    const signal = controller.signal;
    message('Finding cities...');
    try {
      const matches = await findCities(query, getKey(), signal);
      if (signal.aborted || current !== version) return;
      cities = matches;
      if (!cities.length) { message('No cities found. Try another name.'); return; }
      results.replaceChildren();
      cities.forEach((city, index) => {
        const option = document.createElement('div');
        option.className = 'city-option';
        option.id = `city-option-${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        const name = document.createElement('strong');
        name.textContent = city.name;
        const region = document.createElement('span');
        region.textContent = [city.region, city.country].filter(Boolean).join(', ');
        option.append(name, region);
        option.onmousedown = event => event.preventDefault();
        option.onclick = () => select(city);
        results.append(option);
      });
    } catch (error) {
      if (!signal.aborted && current === version) message('Could not load suggestions. Check your connection and search again.');
    }
  }

  input.addEventListener('input', event => {
    close();
    const query = input.value.trim();
    if (event.isComposing || query.length < 2) return;
    timer = setTimeout(() => search(query), 300);
  });
  input.addEventListener('compositionend', () => {
    close();
    if (input.value.trim().length >= 2) timer = setTimeout(() => search(input.value), 300);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (results.hidden || !cities.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + cities.length) % cities.length;
      [...results.children].forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
      input.setAttribute('aria-activedescendant', `city-option-${active}`);
      results.children[active].scrollIntoView({block:'nearest'});
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      select(cities[active]);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!input.closest('form').contains(event.target)) close();
  });
  input.closest('form').addEventListener('focusout', event => {
    if (!input.closest('form').contains(event.relatedTarget)) close();
  });
  return {search, close};
}
