import { describe, it, expect, vi } from 'vitest'
  import { mount } from '@vue/test-utils'
  import AddTorrentModal from '../../components/AddTorrentModal.vue'

const stubs = { FontAwesomeIcon: true }

describe('AddTorrentModal', () => {
  it('starts at file tab', async () => {
    const wrapper = mount(AddTorrentModal, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tabs li:first-child').classes()).toContain('is-active')
  })

  it('changes to magnet link tab', async () => {
    const wrapper = mount(AddTorrentModal, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.tabs li a')[1].trigger('click')
    expect(wrapper.find('.tabs li:last-child').classes()).toContain('is-active')
  })

  it('button is disabled without magnet link', async () => {
    const wrapper = mount(AddTorrentModal, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.tabs li a')[1].trigger('click')
    expect(wrapper.find('footer .button.is-primary').attributes('disabled')).toBeDefined()
  })

  it('button is enabled when magnet link is present', async () => {
    const wrapper = mount(AddTorrentModal, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.tabs li a')[1].trigger('click')
    await wrapper.find('input[type="text"]').setValue('magnet:?xt=urn:btih:abc')
    expect(wrapper.find('footer .button.is-primary').attributes('disabled')).toBeUndefined()
  })

  it('emits close when clicking on close button', async () => {
    const wrapper = mount(AddTorrentModal, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.find('footer .button.ml-2').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows error message when adding magnet link fails', async () => {
    vi.mocked(window.electronAPI.torrent.addMagnet).mockRejectedValueOnce(new Error('Falha'))
    const wrapper = mount(AddTorrentModal, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.tabs li a')[1].trigger('click')
    await wrapper.find('input[type="text"]').setValue('magnet:?xt=urn:btih:abc')
    await wrapper.find('footer .button.is-primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.has-text-danger').text()).toContain('Falha')
  })
})