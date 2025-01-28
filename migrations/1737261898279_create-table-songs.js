exports.up = (pgm) => {
  pgm.createTable(
    'songs',
    {
      id: {
        type: 'VARCHAR(50)',
        primaryKey: true,
      },
      title: {
        type: 'VARCHAR(80)',
        notNull: true,
      },
      year: {
        type: 'INT',
        notNull: true,
      },
      genre: {
        type: 'VARCHAR(15)',
        notNull: true,
      },
      performer: {
        type: 'VARCHAR(80)',
        notNull: true,
      },
      duration: {
        type: 'INT',
      },
      album_id: {
        type: 'VARCHAR(50)',
      },
    },
  );
};

exports.down = (pgm) => {
  pgm.dropTable('songs');
};
