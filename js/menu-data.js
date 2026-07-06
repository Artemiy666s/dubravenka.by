window.MENU_DATA = {
  categories: [
    { id: 'pizza', name: 'Пицца', icon: 'pizza' },
    { id: 'drinks', name: 'Напитки', icon: 'drinks' },
    { id: 'hot', name: 'Горячее', icon: 'hot' },
    { id: 'fry', name: 'Фритюр', icon: 'fry' },
    { id: 'salads', name: 'Салаты', icon: 'salads' },
    { id: 'sets', name: 'Сеты', icon: 'sets' }
  ],

  pizza: [
    { id: 'pepperoni', name: 'Пепперони', desc: 'соус томатный, сыр моцарелла, пепперони', price: 24.90, image: 'assets/images/food/pizza-pepperoni.png' },
    { id: 'ham-mush', name: 'Ветчина и грибы', desc: 'соус томатный, сыр моцарелла, ветчина, шампиньоны', price: 24.90, image: 'assets/images/food/pizza-ham.png' },
    { id: 'meat', name: 'Мясная', desc: 'соус томатный, сыр моцарелла, пепперони, ветчина, бекон', price: 24.90, image: 'assets/images/food/pizza-meat.png' },
    { id: 'four-cheese', name: 'Четыре сыра', desc: 'моцарелла, пармезан, дор блю, чеддер', price: 26.90, image: 'assets/images/food/pizza-four-cheese.jpg' }
  ],

  hot: [
    { id: 'pork-shash', name: 'Шашлык из свинины', desc: '100 г', price: 8.70, image: 'assets/images/food/pork-shash.jpg' },
    { id: 'chicken-shash', name: 'Шашлык из курицы', desc: '100 г', price: 7.10, image: 'assets/images/food/chicken-shash.jpg' },
    { id: 'wings', name: 'Куриные крылышки на гриле', desc: '100 г', price: 6.20, image: 'assets/images/food/wings.jpg' },
    { id: 'veg-grill', name: 'Овощи на гриле', desc: '100 г', price: 6.50, image: 'assets/images/food/veg-grill.jpg' },
    { id: 'mush-bacon', name: 'Шампиньоны в беконе', desc: '100 г', price: 12, image: 'assets/images/food/mush-bacon.jpg' }
  ],

  fry: [
    { id: 'fries', name: 'Картошка фри', desc: '100 г', price: 5, image: 'assets/images/food/fries.jpg' },
    { id: 'shrimp', name: 'Креветки', desc: '100 г', price: 30, image: 'assets/images/food/shrimp.jpg' },
    { id: 'nuggets', name: 'Наггетсы', desc: '100 г', price: 7, image: 'assets/images/food/nuggets.jpg' },
    { id: 'onion', name: 'Луковые кольца', desc: '100 г', price: 7, image: 'assets/images/food/onion.jpg' },
    { id: 'cheese-sticks', name: 'Сырные палочки', desc: '100 г', price: 7, image: 'assets/images/food/cheese-sticks.jpg' },
    { id: 'draniki', name: 'Драники со сметаной', desc: '100 г', price: 5.90, image: 'assets/images/food/draniki.jpg' },
    { id: 'sauce', name: 'Соус в ассортименте', desc: '50 г', price: 1, image: 'assets/images/food/sauce.jpg' }
  ],

  salads: [
    { id: 'caesar-chicken', name: 'Цезарь с курицей', desc: 'салат, курица, сухарики, соус', price: 17.90, image: 'assets/images/food/caesar-chicken.jpg' },
    { id: 'caesar-shrimp', name: 'Цезарь с креветкой', desc: 'салат, креветки, сухарики, соус', price: 19.90, image: 'assets/images/food/caesar-shrimp.jpg' },
    { id: 'greek', name: 'Салат греческий', desc: 'огурец, помидор, сыр фета, маслины', price: 15, image: 'assets/images/food/greek.jpg' },
    { id: 'eggplant', name: 'Салат с баклажанами', desc: 'баклажаны, помидоры, зелень', price: 16, image: 'assets/images/food/eggplant.jpg' }
  ],

  sets: [
    {
      id: 'beer-set',
      name: 'Пивной сет',
      weight: '450 г',
      desc: 'картошка фри, луковые кольца, гренки, сыр копчёный, сырные палочки, соус сырный, соус кетчуп',
      price: 30,
      image: 'assets/images/food/beer-set.jpg'
    },
    {
      id: 'meat-set',
      name: 'Мясной сет',
      weight: '1000 г',
      desc: 'шашлык из мяса, куриное бедро, морковь по-корейски, соленья, зелень',
      price: 70,
      image: 'assets/images/food/meat-set.jpg'
    },
    {
      id: 'fruit-set',
      name: 'Фруктовый сет',
      weight: '500 г',
      desc: 'апельсин, виноград, груша, яблоко',
      price: 29.80,
      image: 'assets/images/food/fruit-set.jpg'
    },
    {
      id: 'veg-set',
      name: 'Овощной сет',
      weight: '500 г',
      desc: 'огурец, помидор, перец, рулетики из баклажана, зелень, маслины, оливки',
      price: 25,
      image: 'assets/images/food/veg-set.jpg'
    }
  ],

  drinks: {
    beer: {
      title: 'Пиво разливное',
      items: [
        { id: 'beer-light', name: 'Светлое', desc: '0.5 л', price: 7.5, icon: 'beer-mug', image: 'assets/images/food/beer-light.jpg' },
        { id: 'beer-dark', name: 'Тёмное', desc: '0.5 л', price: 7.5, icon: 'beer-mug', image: 'assets/images/food/beer-dark.jpg' }
      ]
    },
    kvass: {
      title: 'Квас',
      items: [
        { id: 'kvass', name: 'Квас', desc: '0.5 л', price: 3, icon: 'kvass', image: 'assets/images/food/kvass.jpg' }
      ]
    },
    soft: {
      title: 'Безалкогольные напитки',
      items: [
        { id: 'mors', name: 'Ягодный морс', desc: '0.5 л', price: 4, icon: 'glass', image: 'assets/images/food/mors.jpg' },
        { id: 'lemonade', name: 'Лимонад домашний', desc: '0.5 л', price: 5, icon: 'glass', image: 'assets/images/food/lemonade.jpg' },
        { id: 'water-still', name: 'Вода негазированная', desc: '0.5 л', price: 2, icon: 'bottle', image: 'assets/images/food/water-still.jpg' },
        { id: 'water-spark', name: 'Вода газированная', desc: '0.5 л', price: 2, icon: 'bottle', image: 'assets/images/food/water-spark.jpg' }
      ]
    }
  },

  promotions: [
    {
      id: 'beer-evening',
      title: 'Пивной вечер',
      desc: '−15% на всё пиво с 17:00 до 20:00',
      sub: 'по будням',
      image: 'assets/images/promotions/promo-beer.jpg'
    },
    {
      id: 'birthday',
      title: 'День рождения',
      desc: 'Скидка 10%',
      sub: 'за 2 дня до и после',
      image: 'assets/images/promotions/promo-cake.jpg'
    },
    {
      id: 'happy-hour',
      title: 'Счастливые часы',
      desc: '2+1=3 на разливное пиво',
      sub: 'ежедневно 14:00–16:00',
      image: 'assets/images/promotions/promo-mugs.jpg'
    }
  ],

  contacts: {
    phone: '+375 (29) 541-04-24',
    address: 'г. Могилев, наб. реки Дубровенка, 2',
    geocodeQuery: 'Могилёв, набережная реки Дубровенка, 2',
    mapLabel: 'DUBRAVENKA',
    hours: '11:00 — 23:00',
    coords: { lat: 53.91145, lng: 30.330412 },
    yandexApiKey: 'bd204ad5-2ea0-4e5a-849e-ef4c732cc205'
  }
};
