const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(
    PlaylistsService,
    PlaylistSongsService,
    PlaylistSongActivitiesService,
    PlaylistsValidator,
  ) {
    this._playlistsService = PlaylistsService;
    this._playlistSongsService = PlaylistSongsService;
    this._playlistSongActivitiesService = PlaylistSongActivitiesService;
    this._playlistsValidator = PlaylistsValidator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._playlistsValidator.validatePlaylistsPayload(request.payload);

    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._playlistsService.addPlaylist({ name, owner: credentialId });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;

    const playlists = await this._playlistsService.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistsOwner(id, credentialId);
    await this._playlistsService.deletePlaylistsById(id);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });

    return response;
  }

  async postSongToPlaylistHandler(request, h) {
    this._playlistsValidator.validatePlaylistSongsPayload(request.payload);

    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    await this._playlistsService.verifyPlaylistsAccess(playlistId, credentialId);
    await this._playlistSongsService.addSongToPlaylist(playlistId, songId);
    await this._playlistSongActivitiesService.activitiesAddSongPlaylist(
      playlistId,
      songId,
      credentialId,
    );

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke dalam playlist',
    });
    response.code(201);
    return response;
  }

  async getSongsFromPlaylistByIdHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    await this._playlistsService.verifyPlaylistsAccess(playlistId, credentialId);

    const playlist = await this._playlistSongsService.getSongsFromPlaylist(playlistId);

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongFromPlaylistByIdHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    await this._playlistsService.verifyPlaylistsAccess(playlistId, credentialId);
    await this._playlistSongsService.deleteSongFromPlaylist(playlistId, songId);
    await this._playlistSongActivitiesService.activitiesDeleteSongPlaylist(
      playlistId,
      songId,
      credentialId,
    );

    return h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    });
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    await this._playlistsService.verifyPlaylistsAccess(playlistId, credentialId);

    const activities = await this._playlistSongActivitiesService.getActivitiesSongPlaylist(
      playlistId,
    );

    return {
      status: 'success',
      data: activities,
    };
  }
}

module.exports = PlaylistsHandler;
