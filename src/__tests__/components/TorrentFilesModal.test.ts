import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import TorrentFilesModal from '../../components/TorrentFilesModal.vue'

const stubs = { FontAwesomeIcon: true }

const mockFiles = [
  { name: 'movie.mp4', path: 'movie.mp4', length: 2_000_000_000 },
  { name: 'www.YTS.MX.jpg', path: 'www.YTS.MX.jpg', length: 53_248 },
]

beforeEach(() => {
  vi.mocked(window.electronAPI.torrent.peekFiles).mockResolvedValue(mockFiles)
})

describe('TorrentFilesModal', () => {
  it('shows spinner while loading', () => {
    vi.mocked(window.electronAPI.torrent.peekFiles).mockReturnValue(new Promise(() => {}))
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    expect(wrapper.find('.has-text-grey').text()).toContain('Buscando')
  })

  it('shows files after loading', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    const labels = wrapper.findAll('.file-name')
    expect(labels).toHaveLength(2)
    expect(labels[0].text()).toBe('movie.mp4')
    expect(labels[1].text()).toBe('www.YTS.MX.jpg')
  })

  it('selects all files by default', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    checkboxes.forEach(cb => expect((cb.element as HTMLInputElement).checked).toBe(true))
  })

  it('toggleAll deselects all when all are selected', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    await wrapper.find('a.is-size-7').trigger('click')
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    checkboxes.forEach(cb => expect((cb.element as HTMLInputElement).checked).toBe(false))
  })

  it('toggleAll selects all when none are selected', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    await wrapper.find('a.is-size-7').trigger('click') // deselect all
    await wrapper.find('a.is-size-7').trigger('click') // select all
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    checkboxes.forEach(cb => expect((cb.element as HTMLInputElement).checked).toBe(true))
  })

  it('emits confirm with selected file names', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    await wrapper.find('footer .button.is-primary').trigger('click')
    expect(wrapper.emitted('confirm')?.[0][0]).toEqual(['movie.mp4', 'www.YTS.MX.jpg'])
  })

  it('emits confirm with only selected files when some are deselected', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[1].setValue(false)
    await wrapper.find('footer .button.is-primary').trigger('click')
    expect(wrapper.emitted('confirm')?.[0][0]).toEqual(['movie.mp4'])
  })

  it('download button is disabled when no files selected', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    await wrapper.find('a.is-size-7').trigger('click') // deselect all
    expect(wrapper.find('footer .button.is-primary').attributes('disabled')).toBeDefined()
  })

  it('emits close when clicking cancel', async () => {
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    await wrapper.find('footer .button.ml-2').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows error when peekFiles fails', async () => {
    vi.mocked(window.electronAPI.torrent.peekFiles).mockRejectedValueOnce(new Error('fail'))
    const wrapper = mount(TorrentFilesModal, {
      props: { magnetUri: 'magnet:?xt=urn:btih:abc' },
      global: { stubs }
    })
    await flushPromises()
    expect(wrapper.find('.has-text-danger').text()).toContain('Erro ao buscar')
  })
})
