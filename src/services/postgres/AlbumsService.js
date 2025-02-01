const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const queryResult = await this._pool.query(query);
    if (!queryResult.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan!');
    }
    return queryResult.rows[0].id;
  }

  async getAlbumById(id) {
    const queryAlbum = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const querySongs = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id=$1',
      values: [id],
    };
    const queryAlbumResult = await this._pool.query(queryAlbum);
    const querySongsResult = await this._pool.query(querySongs);

    if (!queryAlbumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan!');
    }
    return {
      ...queryAlbumResult.rows[0],
      songs: querySongsResult.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };
    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan!');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan!');
    }
  }

  async editCoverAlbumById(id, fileLocation) {
    const query = {
      text: 'UPDATE albums SET cover = $2 WHERE id = $1',
      values: [id, fileLocation],
    };

    await this._pool.query(query);
  }
}

module.exports = AlbumsService;
