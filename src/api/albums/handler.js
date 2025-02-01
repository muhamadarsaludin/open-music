const autoBind = require('auto-bind');
const config = require('../../utils/config');

class AlbumsHandler {
  constructor(service, validator, storageService, uploadsValidator) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan!',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui!',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus!',
    };
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;

    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);
    await this._service.getAlbumById(id);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const fileLocation = `http://${config.app.host}:${config.app.port}/albums/covers/${filename}`;

    await this._service.editCoverAlbumById(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Cover berhasil diupload',
    });

    response.code(201);
    return response;
  }
}

module.exports = AlbumsHandler;
