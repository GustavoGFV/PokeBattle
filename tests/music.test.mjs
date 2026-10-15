import assert from 'node:assert/strict'
import test from 'node:test'
import { getSpotifyPlaylistUrl, pickBattlePlaylist } from '../src/ui/MusicController.ts'

test('Spotify playlist links normalize to safe playlist URLs', () => {
  assert.equal(
    getSpotifyPlaylistUrl('https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6?si=example'),
    'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
  )
  assert.equal(getSpotifyPlaylistUrl('https://example.com/playlist/abc'), null)
  assert.equal(getSpotifyPlaylistUrl('not a url'), null)
})

test('battle music picks a valid playlist randomly and handles an empty list', () => {
  const playlists = [
    'not a spotify url',
    'https://open.spotify.com/playlist/first',
    'https://open.spotify.com/playlist/second',
  ]

  assert.equal(pickBattlePlaylist(playlists, () => 0), 'https://open.spotify.com/playlist/first')
  assert.equal(pickBattlePlaylist(playlists, () => 0.99), 'https://open.spotify.com/playlist/second')
  assert.equal(pickBattlePlaylist([], () => 0.5), null)
})