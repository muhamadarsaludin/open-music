const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistSongActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async activitiesAddSongPlaylist(playlistId, songId, userId) {
    const activitiesId = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: `INSERT INTO playlist_song_activities (id, playlist_id, song_id, user_id, action, time)
            VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [activitiesId, playlistId, songId, userId, 'add', time],
    };

    await this._pool.query(query);
  }

  async activitiesDeleteSongPlaylist(playlistId, songId, userId) {
    const activitiesId = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: `INSERT INTO playlist_song_activities (id, playlist_id, song_id, user_id, action, time)
            VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [activitiesId, playlistId, songId, userId, 'delete', time],
    };

    await this._pool.query(query);
  }

  async getActivitiesSongPlaylist(playlistId) {
    const query = {
      text: `SELECT PAS.*, U.username, S.title FROM playlist_song_activities PAS
      INNER JOIN users U ON U.id = PAS.user_id
      INNER JOIN songs S ON S.id = PAS.song_id
      WHERE playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Tidak ada aktivitas playlist');
    }

    const activities = result.rows.map((data) => ({
      username: data.username,
      title: data.title,
      action: data.action,
      time: data.time,
    }));

    return {
      playlistId,
      activities,
    };
  }
}

module.exports = PlaylistSongActivitiesService;
