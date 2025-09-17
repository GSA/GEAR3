import { Injectable } from '@angular/core';

declare var gtag: Function;

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {

    public ANALYTIC_EVENT_TYPES = {
        click: 'click',
        page_view: 'page_view',
        search: 'search',
        sidebar_navigation: 'sidebar_navigation', // custom
        sidebar_navigation_keyboard: 'sidebar_navigation_keyboard', // custom
        topbar_navigation: 'topbar_navigation', // custom
        topbar_navigation_keyboard: 'topbar_navigation_keyboard' // custom
    };

    constructor() {}

    public logClickEvent(pagePathValue: string) {
        gtag('event', this.ANALYTIC_EVENT_TYPES.click, { 'page_path': pagePathValue });
    }

    public logPageViewEvent(pagePathValue: string) {
        gtag('event', this.ANALYTIC_EVENT_TYPES.page_view, { 'page_path': pagePathValue });
    }

    public logSearchEvent(searchTermValue: string) {
        gtag('event', this.ANALYTIC_EVENT_TYPES.search, { 'search_term': searchTermValue });
    }

    public logSidebarNavEvent(routeValue: string, isKeyboardEvent: boolean = false) {
        if(isKeyboardEvent) {
            gtag('event', this.ANALYTIC_EVENT_TYPES.sidebar_navigation_keyboard, { 'route': routeValue });
        } else {
            gtag('event', this.ANALYTIC_EVENT_TYPES.sidebar_navigation, { 'route': routeValue });
        }
    }
}
