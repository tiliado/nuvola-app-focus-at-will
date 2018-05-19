/*
 * Copyright 2018 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

(function (Nuvola) {
  var player = Nuvola.$object(Nuvola.MediaPlayer)

  var PlaybackState = Nuvola.PlaybackState
  var PlayerAction = Nuvola.PlayerAction

  var WebApp = Nuvola.$WebApp()

  // Initialization routines
  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    var state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  // Page is ready for magic
  WebApp._onPageReady = function () {
    Nuvola.actions.connect('ActionActivated', this)

    this.update()
  }

  // Extract data from the web page
  WebApp.update = function () {
    var track = {
      title: null,
      artist: null,
      album: null,
      artLocation: null,
      rating: null
    }
    var elms = this.getElements()
    if (elms.meta) {
      track.title = elms.meta[0].textContent || null
      track.artist = elms.meta[1].textContent || null
      if (track.artist && track.artist.startsWith('By: ')) {
        track.artist = track.artist.substring(4)
      }
    }
    if (elms.background) {
      track.artLocation = elms.background.split('"')[1]
    }
    player.setTrack(track)

    var state = PlaybackState.UNKNOWN
    if (elms.play) {
      state = PlaybackState.PAUSED
    } else if (elms.stop) {
      state = PlaybackState.PLAYING
    }
    player.setPlaybackState(state)

    player.setCanGoPrev(false)
    player.setCanGoNext(!!elms.skip)
    player.setCanPlay(!!elms.play)
    player.setCanPause(!!elms.stop)

    player.updateVolume(elms.volumeHandle ? elms.volumeHandle.getAttribute('aria-valuenow') / 100 : null)
    player.setCanChangeVolume(!!elms.volumeBar)

    // Schedule the next update
    setTimeout(this.update.bind(this), 500)
  }

  WebApp._onActionActivated = function (emitter, name, param) {
    var elms = this.getElements()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
        Nuvola.clickOnElement(elms.stop || elms.play)
        break
      case PlayerAction.PLAY:
        Nuvola.clickOnElement(elms.play)
        break
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(elms.stop)
        break
      case PlayerAction.NEXT_SONG:
        Nuvola.clickOnElement(elms.skip)
        break
      case PlayerAction.CHANGE_VOLUME:
        Nuvola.clickOnElement(elms.volumeBar, param, 0.5)
        break
    }
  }

  WebApp.getElements = function () {
    var elms = {
      play: document.querySelector('.appContentContainer .playerControls .playButton'),
      stop: null,
      skip: document.querySelector('.appContentContainer .playerControls .skipButton'),
      meta: document.querySelector('.appContentContainer .progress'),
      volumeHandle: document.querySelector('.volumeSlider .rc-slider-handle'),
      volumeBar: document.querySelector('.volumeSlider .rc-slider-rail'),
      background: null
    }
    if (elms.play && elms.play.firstChild.className === 'icon-stop') {
      elms.stop = elms.play
      elms.play = null
    }
    if (elms.meta) {
      elms.meta = elms.meta.parentNode.childNodes
    }
    for (var div of document.querySelectorAll('.appContentContainer div')) {
      if (div.style.backgroundImage) {
        elms.background = div.style.backgroundImage + ''
        break
      }
    }
    return elms
  }

  WebApp.start()
})(this)  // function(Nuvola)
