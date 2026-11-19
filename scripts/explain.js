
require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../src/models/note');

const pick = (result) =>
  (Array.isArray(result) ? result[0] : result).executionStats;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Note.syncIndexes();

  // Truy vấn ép MongoDB quét toàn bộ collection
  const scan = pick(
    await Note.find({ tags: 'docker' })
      .hint({ $natural: 1 })
      .explain('executionStats')
  );

  // Truy vấn sử dụng chỉ mục tags
  const idx = pick(
    await Note.find({ tags: 'docker' })
      .explain('executionStats')
  );

  const ratio = scan.totalDocsExamined /
    Math.max(idx.totalDocsExamined, 1);

  console.table({
    'Quét toàn bộ': {
      docsExamined: scan.totalDocsExamined,
      returned: scan.nReturned,
      ms: scan.executionTimeMillis
    },
    'Dùng chỉ mục': {
      docsExamined: idx.totalDocsExamined,
      returned: idx.nReturned,
      ms: idx.executionTimeMillis
    }
  });

  console.log(
    `Chỉ mục giảm số tài liệu phải quét khoảng ${ratio.toFixed(2)} lần`
  );

  await mongoose.disconnect();
})().catch(async err => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
