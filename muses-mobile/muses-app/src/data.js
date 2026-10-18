// Đặt ảnh export từ Figma vào src/assets/ với đúng tên dưới đây
export const splashImage = require('./assets/splash.jpg');

export const slides = [
  {
    id: '1',
    collection: 'Vietnamese\nCulture\nCollection',
    title: 'Beauty of\nCulture',
    tag: 'Discovery',
    image: require('./assets/hero.jpg'),
  },
  // Thêm slide khác ở đây, ví dụ: { id: '2', ... }
];

export const highlights = [
  { id: 'h1', image: require('./assets/highlight1.jpg') },
  { id: 'h2', image: require('./assets/highlight2.jpg') },
  { id: 'h3', image: require('./assets/highlight3.jpg') },
];
