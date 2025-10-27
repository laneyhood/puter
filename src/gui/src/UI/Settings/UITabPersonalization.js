/**
 * Copyright (C) 2024 Puter Technologies Inc.
 *
 * This file is part of Puter.
 *
 * Puter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import UIWindowThemeDialog from '../UIWindowThemeDialog.js';
import UIWindowDesktopBGSettings from '../UIWindowDesktopBGSettings.js';

// About
export default {
    id: 'personalization',
    title_i18n_key: 'personalization',
    icon: 'palette-outline.svg',
    html: () => {
        return `
            <h1>${i18n('personalization')}</h1>
            <div class="settings-card">
                <strong>${i18n('background')}</strong>
                <div style="flex-grow:1;">
                    <button class="button change-background" style="float:right;">${i18n('change')}</button>
                </div>
            </div>
            <div class="settings-card">
                <strong>${i18n('ui_colors')}</strong>
                <div style="flex-grow:1;">
                    <button class="button change-ui-colors" style="float:right;">${i18n('change')}</button>
                </div>
            </div>
            <div class="settings-card">
                <strong style="flex-grow:1;">${i18n('clock_visibility')}</strong>
                <select class="change-clock-visible" style="margin-left: 10px; max-width: 300px;">
                    <option value="auto">${i18n('clock_visible_auto')}</option>
                    <option value="hide">${i18n('clock_visible_hide')}</option>
                    <option value="show">${i18n('clock_visible_show')}</option>
                </select>
            </div>
            <div class="settings-card">
                <strong style="flex-grow:1;">${i18n('toolbar_auto_hide')}</strong>
                <div style="flex-grow:1;">
                    <label class="toggle-switch" for="toolbar_auto_hide_enabled" style="float:right;">
                        <input type="checkbox" class="toolbar-auto-hide" id="toolbar_auto_hide_enabled">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div class="settings-card" style="display: block; height: auto;">
                <strong style="margin: 15px 0 30px; display: block;">${i18n('menubar_style')}</strong>
                <div style="flex-grow:1; margin-top: 10px;">
                    <div>
                        <label style="display:inline;" for="menubar_style_system">
                        <input type="radio" name="menubar_style" class="menubar_style" value="system" id="menubar_style_system">
                        <strong>${i18n('menubar_style_system')}</strong>
                        <p style="margin-left: 17px; margin-top: 5px; margin-bottom: 20px;">Set the menubar based on the host system settings</p>
                        </label>
                    </div>
                    <div>
                        <label style="display:inline;" for="menubar_style_desktop">
                        <input type="radio" name="menubar_style" class="menubar_style" value="desktop" id="menubar_style_desktop">
                        <strong>${i18n('menubar_style_desktop')}</strong>
                        <p style="margin-left: 17px; margin-top: 5px; margin-bottom: 20px;">Show app menubar on in the desktop toolbar</p>
                        </label>
                    </div>

                    <div>
                        <label style="display:inline;" for="menubar_style_window">
                        <input type="radio" name="menubar_style" class="menubar_style" value="window" id="menubar_style_window">
                        <strong>${i18n('menubar_style_window')}</strong>
                        <p style="margin-left: 17px; margin-top: 5px; margin-bottom: 20px;">Show app menubar on top of the app window</p>
                        </label>
                    </div>
                </div>
            </div>`;
    },
    init: ($el_window) => {
        $el_window.find('.change-ui-colors').on('click', function (e) {
            UIWindowThemeDialog({
                window_options:{
                    parent_uuid: $el_window.attr('data-element_uuid'),
                    disable_parent_window: true,
                    parent_center: true,
                }
            });
        });
        $el_window.find('.change-background').on('click', function (e) {
            UIWindowDesktopBGSettings({
                window_options:{
                    parent_uuid: $el_window.attr('data-element_uuid'),
                    disable_parent_window: true,
                    parent_center: true,
                }
            });
        });

        $el_window.on('change', 'select.change-clock-visible', function(e){
            window.change_clock_visible(this.value);
        });

        window.change_clock_visible();

        // Toolbar auto-hide setting
        $el_window.on('change', '.toolbar-auto-hide', function(e){
            const enabled = $(this).is(':checked');
            // Save setting to user preferences
            window.user_preferences.toolbar_auto_hide = enabled;
            localStorage.setItem('user_preferences', JSON.stringify(window.user_preferences));
            
            // Also save to puter.kv for consistency
            puter.kv.set('toolbar_auto_hide', enabled);
            
            // Apply setting immediately
            if (enabled) {
                // Enable auto-hide functionality
                window.toolbar_auto_hide_enabled = true;
                
                // Check if mouse is near top edge and, if so, show toolbar immediately
                window.checkMouseAndShowToolbar();
                
                // Start auto-hide timer immediately when enabled
                if (window.toolbarAutoHideTimeout) {
                    clearTimeout(window.toolbarAutoHideTimeout);
                }
                window.toolbarAutoHideTimeout = setTimeout(() => {
                    if (window.toolbar_auto_hide_enabled) {
                        $('.toolbar').removeClass('auto-show').addClass('auto-hidden');
                        window.isToolbarHidden = true;
                        $('.window-container').css('top', '0px');
                    }
                }, 2000); // 2 seconds
            } else {
                // Disable auto-hide functionality
                window.toolbar_auto_hide_enabled = false;
                
                // Use global function to force show toolbar
                window.forceShowToolbar();
                
                // Force show toolbar multiple times to ensure it sticks
                setTimeout(() => {
                    window.forceShowToolbar();
                }, 50);
                
                setTimeout(() => {
                    window.forceShowToolbar();
                }, 200);
            }
        });

        // Load toolbar auto-hide setting
        puter.kv.get('toolbar_auto_hide').then(async (val) => {
            const enabled = val === true || val === 'true';
            $el_window.find('.toolbar-auto-hide').prop('checked', enabled);
            window.toolbar_auto_hide_enabled = enabled;
        });

        puter.kv.get('menubar_style').then(async (val) => {
            if(val === 'system' || !val){
                $el_window.find('#menubar_style_system').prop('checked', true);
            }else if(val === 'desktop'){
                $el_window.find('#menubar_style_desktop').prop('checked', true);
            }
            else if(val === 'window'){
                $el_window.find('#menubar_style_window').prop('checked', true);
            }
        })

        $el_window.find('.menubar_style').on('change', function (e) {
            let value = $(this).val();
            if(value === 'system' || value === 'desktop' || value === 'window'){
                // save the new style to cloud kv
                puter.kv.set('menubar_style', value);
                
                if(value === 'system'){
                    if(window.detectHostOS() === 'macos')
                        value = 'desktop';
                    else
                        value = 'window';
                }
                // apply the new style
                if(value === 'desktop'){
                    $('body').addClass('menubar-style-desktop');
                    $('.window-menubar').each((_, el) => {
                        $(el).insertAfter('.toolbar-puter-logo');
                        // add window-menubar-global
                        $(el).addClass('window-menubar-global');
                        // hide
                        $(el).hide();
                    })
                }else{
                    $('body').removeClass('menubar-style-desktop');
                    $('.window-menubar-global').each((_, el) => {
                        let win_id = $(el).attr('data-window-id');
                        $(el).insertAfter('.window[data-id="'+win_id+'"] .window-head');
                        // remove window-menubar-global
                        $(el).removeClass('window-menubar-global');
                        // show
                        $(el).css('display', 'flex');
                    })
                }
                window.menubar_style = value;
            }else{
                console.error('Invalid menubar style value');
            }
        })
    },
};
