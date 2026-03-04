import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Sidebar from '../../components/Sidebar.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', redirect: '/torrents' },
    { path: '/torrents', component: { template: '<div/>' } },
    { path: '/settings', component: { template: '<div/>' } },
  ]
})

describe('Sidebar', () => {
  it('shows a link for torrents', async () => {
    const wrapper = mount(Sidebar, { global: { plugins: [router], stubs: { FontAwesomeIcon: true } }
})
    await router.isReady()
    expect(wrapper.html()).toContain('/torrents')
  })

  it('shows a link for settings', async () => {
    const wrapper = mount(Sidebar, { global: { plugins: [router], stubs: { FontAwesomeIcon: true } }
})
    await router.isReady()
    expect(wrapper.html()).toContain('/settings')
  })
})