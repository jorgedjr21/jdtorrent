import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SettingsView from '../../views/SettingsView.vue'

const stubs = { FontAwesomeIcon: true }

describe('SettingsView', () => {
  it('loads the downloadPath when mounted', async () => {
    const wrapper = mount(SettingsView, { global: { stubs } })
    await flushPromises()
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value)
      .toBe('/downloads')
  })

  it('shows feedback when saving', async () => {
    const wrapper = mount(SettingsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.find('button.is-primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Configurações salvas!')
  })

  it('call settings.set to save the settings', async () => {
    const wrapper = mount(SettingsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.find('button.is-primary').trigger('click')
    expect(vi.mocked(window.electronAPI.settings.set))
      .toHaveBeenCalledWith({ downloadPath: '/downloads' })
  })
})