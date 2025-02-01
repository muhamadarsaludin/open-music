const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const { mapAlbumsToModel } = require('../../utils/albums');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
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
      ...queryAlbumResult.rows.map(mapAlbumsToModel)[0],
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

  async getAlbumLikesByAlbumId(id) {
    try {
      const albumLikesCount = await this._cacheService.get(`album_likes:${id}`);

      return {
        source: 'cache',
        data: JSON.parse(albumLikesCount),
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };
      const albumLikesCount = await this._pool.query(query);

      await this._cacheService.set(`album_likes:${id}`, albumLikesCount.rowCount);

      return {
        source: 'db',
        data: albumLikesCount.rowCount,
      };
    }
  }

  async addAlbumLikes(albumId, userId) {
    const id = `likes-${nanoid(16)}`;

    const queryCheck = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };
    const existLike = await this._pool.query(queryCheck);
    if (existLike.rowCount) {
      throw new InvariantError('Likes gagal ditambahkan. Anda sudah menyukai album ini.');
    }

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Likes gagal ditambahkan');
    }

    await this._cacheService.delete(`album_likes:${albumId}`);

    return result.rows[0].id;
  }

  async deleteAlbumLikes(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Likes gagal dihapus');
    }

    await this._cacheService.delete(`album_likes:${albumId}`);
  }
}

module.exports = AlbumsService;
