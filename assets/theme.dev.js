
/*
* @license
* Story Theme (c) Groupthought Themes
*
* This file is included for advanced development by
* Shopify Agencies.  Modified versions of the theme
* code are not supported by Shopify or Groupthought.
*
* In order to use this file you will need to change
* theme.js to theme.dev.js in /layout/theme.liquid
*
*/

(function (scrollLock, FlickityFade, themeCurrency, themeAddresses, Sqrl, axios, Flickity, MicroModal, Rellax, FlickitySync) {
    'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var Sqrl__namespace = /*#__PURE__*/_interopNamespaceDefault(Sqrl);

    (function() {
        const env = {"NODE_ENV":"production"};
        try {
            if (process) {
                process.env = Object.assign({}, process.env);
                Object.assign(process.env, env);
                return;
            }
        } catch (e) {} // avoid ReferenceError: process is not defined
        globalThis.process = { env:env };
    })();

    window.theme = window.theme || {};

    window.theme.sizes = {
      small: 480,
      medium: 768,
      large: 990,
      widescreen: 1400,
    };

    window.theme.keyboardKeys = {
      TAB: 9,
      ENTER: 13,
      ESCAPE: 27,
      SPACE: 32,
      LEFTARROW: 37,
      RIGHTARROW: 39,
    };

    function debounce$1(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    let lastWidth = window.innerWidth;

    function dispatch$2() {
      document.dispatchEvent(
        new CustomEvent('theme:resize', {
          bubbles: true,
        })
      );

      if (window.innerWidth != lastWidth) {
        document.dispatchEvent(
          new CustomEvent('theme:resize:width', {
            bubbles: true,
          })
        );
        lastWidth = window.innerWidth;
      }
    }

    function resizeListener() {
      window.addEventListener(
        'resize',
        debounce$1(function () {
          dispatch$2();
        }, 50)
      );
    }

    let prev = window.pageYOffset;
    let up = null;
    let down = null;
    let wasUp = null;
    let wasDown = null;
    let scrollLockTimeout = 0;

    function dispatch$1() {
      const position = window.pageYOffset;
      if (position > prev) {
        down = true;
        up = false;
      } else if (position < prev) {
        down = false;
        up = true;
      } else {
        up = null;
        down = null;
      }
      prev = position;
      document.dispatchEvent(
        new CustomEvent('theme:scroll', {
          detail: {
            up,
            down,
            position,
          },
          bubbles: false,
        })
      );
      if (up && !wasUp) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:up', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      if (down && !wasDown) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:down', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      wasDown = down;
      wasUp = up;
    }

    function lock(e) {
      // Prevent body scroll lock race conditions
      setTimeout(() => {
        if (scrollLockTimeout) {
          clearTimeout(scrollLockTimeout);
        }

        scrollLock.disablePageScroll(e.detail, {
          allowTouchMove: (el) => el.tagName === 'TEXTAREA',
        });

        document.documentElement.setAttribute('data-scroll-locked', '');
      });
    }

    function unlock(e) {
      const timeout = e.detail;

      if (timeout) {
        scrollLockTimeout = setTimeout(removeScrollLock, timeout);
      } else {
        removeScrollLock();
      }
    }

    function removeScrollLock() {
      scrollLock.clearQueueScrollLocks();
      scrollLock.enablePageScroll();
      document.documentElement.removeAttribute('data-scroll-locked');
    }

    function scrollListener() {
      let timeout;
      window.addEventListener(
        'scroll',
        function () {
          if (timeout) {
            window.cancelAnimationFrame(timeout);
          }
          timeout = window.requestAnimationFrame(function () {
            dispatch$1();
          });
        },
        {passive: true}
      );

      window.addEventListener('theme:scroll:lock', lock);
      window.addEventListener('theme:scroll:unlock', unlock);
    }

    function moveModals(container) {
      const modals = container.querySelectorAll('[data-modal]');
      const modalBin = document.querySelector('[data-modal-container]');
      modals.forEach((element) => {
        const alreadyAdded = modalBin.querySelector(`[id="${element.id}"]`);

        if (!alreadyAdded) {
          modalBin.appendChild(element);
        } else {
          element.parentNode.removeChild(element);
        }
      });
    }

    function floatLabels(container) {
      const floats = container.querySelectorAll('.form__field');
      floats.forEach((element) => {
        const label = element.querySelector('label');
        const input = element.querySelector('input, textarea');
        if (label && input) {
          input.addEventListener('keyup', (event) => {
            if (event.target.value !== '') {
              label.classList.add('label--float');
            } else {
              label.classList.remove('label--float');
            }
          });
        }
        if (input && input.value && input.value.length) {
          label.classList.add('label--float');
        }
      });
    }

    function errorTabIndex(container) {
      const errata = container.querySelectorAll('.errors');
      errata.forEach((element) => {
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-live', 'assertive');
        element.setAttribute('role', 'alert');
      });
    }

    function readHeights() {
      const h = {};
      h.windowHeight = window.innerHeight;
      h.announcementHeight = getHeight('#shopify-section-announcement');
      h.footerHeight = getHeight('[data-section-type*="footer"]');
      h.menuHeight = getHeight('[data-header-height]');
      h.headerHeight = h.menuHeight + h.announcementHeight;
      h.logoHeight = getFooterLogoWithPadding();
      return h;
    }

    function setVarsOnResize() {
      document.addEventListener('theme:resize', resizeVars);
      setVars();
    }

    function setVars() {
      const {windowHeight, announcementHeight, headerHeight, logoHeight, menuHeight, footerHeight} = readHeights();
      document.documentElement.style.setProperty('--full-screen', `${windowHeight}px`);
      document.documentElement.style.setProperty('--three-quarters', `${windowHeight * 0.75}px`);
      document.documentElement.style.setProperty('--two-thirds', `${windowHeight * 0.66}px`);
      document.documentElement.style.setProperty('--one-half', `${windowHeight * 0.5}px`);
      document.documentElement.style.setProperty('--one-third', `${windowHeight * 0.33}px`);
      document.documentElement.style.setProperty('--one-fifth', `${windowHeight * 0.2}px`);
      document.documentElement.style.setProperty('--menu-height', `${menuHeight}px`);
      document.documentElement.style.setProperty('--announcement-height', `${announcementHeight}px`);
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

      document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
      document.documentElement.style.setProperty('--content-full', `${windowHeight - headerHeight - logoHeight / 2}px`);
      document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);

      document.documentElement.style.setProperty('--scrollbar-width', `${window.innerWidth - document.documentElement.clientWidth}px`);
    }

    function resizeVars() {
      // restrict the heights that are changed on resize to avoid iOS jump when URL bar is shown and hidden
      const {windowHeight, announcementHeight, headerHeight, logoHeight, menuHeight, footerHeight} = readHeights();
      document.documentElement.style.setProperty('--menu-height', `${menuHeight}px`);
      document.documentElement.style.setProperty('--announcement-height', `${announcementHeight}px`);
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

      document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
      document.documentElement.style.setProperty('--content-full', `${windowHeight - headerHeight - logoHeight / 2}px`);
      document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);
    }

    function getHeight(selector) {
      const el = document.querySelector(selector);
      if (el) {
        return el.clientHeight;
      } else {
        return 0;
      }
    }

    function getFooterLogoWithPadding() {
      const height = getHeight('[data-footer-logo]');
      if (height > 0) {
        return height + 20;
      } else {
        return 0;
      }
    }

    function singles(frame, wrappers) {
      // sets the height of any frame passed in with the
      // tallest js-overflow-content as well as any image in that frame
      let padding = 64;
      let tallest = 0;

      wrappers.forEach((wrap) => {
        if (wrap.offsetHeight > tallest) {
          const getMarginTop = parseInt(window.getComputedStyle(wrap).marginTop);
          const getMarginBottom = parseInt(window.getComputedStyle(wrap).marginBottom);
          const getMargin = getMarginTop + getMarginBottom;
          if (getMargin > padding) {
            padding = getMargin;
          }

          tallest = wrap.offsetHeight;
        }
      });
      const images = frame.querySelectorAll('[data-overflow-background]');
      const frames = [frame, ...images];
      frames.forEach((el) => {
        el.style.setProperty('min-height', `calc(${tallest + padding}px + var(--menu-height))`);
      });
    }

    function doubles(section) {
      if (window.innerWidth < window.theme.sizes.medium) {
        // if we are below the small breakpoint, the double section acts like two independent
        // single frames
        let singleFrames = section.querySelectorAll('[data-overflow-frame]');
        singleFrames.forEach((singleframe) => {
          const wrappers = singleframe.querySelectorAll('[data-overflow-content]');
          singles(singleframe, wrappers);
        });
        return;
      }

      const padding = parseInt(getComputedStyle(section).getPropertyValue('--outer')) * 2;
      let tallest = 0;

      const frames = section.querySelectorAll('[data-overflow-frame]');
      const contentWrappers = section.querySelectorAll('[data-overflow-content]');
      contentWrappers.forEach((content) => {
        if (content.offsetHeight > tallest) {
          tallest = content.offsetHeight;
        }
      });
      const images = section.querySelectorAll('[data-overflow-background]');
      let applySizes = [...frames, ...images];
      applySizes.forEach((el) => {
        el.style.setProperty('min-height', `${tallest + padding}px`);
      });
      section.style.setProperty('min-height', `${tallest + padding}px`);
    }

    function preventOverflow(container) {
      const singleFrames = container.querySelectorAll('.js-overflow-container');
      if (singleFrames) {
        singleFrames.forEach((frame) => {
          const wrappers = frame.querySelectorAll('.js-overflow-content');
          singles(frame, wrappers);
          document.addEventListener('theme:resize', () => {
            singles(frame, wrappers);
          });
        });

        // Reload slides if container has slideshow
        const slideshows = container.querySelectorAll('[data-slideshow-wrapper]');

        if (slideshows.length) {
          slideshows.forEach((slideshow) => {
            const slideshowInstance = FlickityFade.data(slideshow);
            if (typeof slideshowInstance !== 'undefined') {
              slideshowInstance.reloadCells();
            }
          });
        }
      }

      const doubleSections = container.querySelectorAll('[data-overflow-wrapper]');
      if (doubleSections) {
        doubleSections.forEach((section) => {
          doubles(section);
          document.addEventListener('theme:resize', () => {
            doubles(section);
          });
        });
      }
    }

    resizeListener();
    scrollListener();

    window.addEventListener('load', () => {
      setVarsOnResize();
      floatLabels(document);
      errorTabIndex(document);
      moveModals(document);
      preventOverflow(document);
    });

    document.addEventListener('shopify:section:load', (e) => {
      document.dispatchEvent(new CustomEvent('theme:header:check', {bubbles: false}));
      const container = e.target;
      floatLabels(container);
      errorTabIndex(container);
      moveModals(container);
      preventOverflow(container);
    });

    document.addEventListener('shopify:section:reorder', () => {
      document.dispatchEvent(new CustomEvent('theme:header:check', {bubbles: false}));
    });

    const selectors$S = {
      templateAddresses: '.template-addresses',
      addressNewForm: '#AddressNewForm',
      btnNew: '[data-btn-address-toggle]',
      btnEdit: '[data-btn-address-edit-toggle]',
      btnDelete: '[data-btn-address-delete]',
      addressCountrySelect: '[data-country-select]',
      defaultConfirmMessage: 'Are you sure you wish to delete this address?',
      editAddress: '#EditAddress',
      dataFormId: 'data-form-id',
      addressCountryNew: 'AddressCountryNew',
      addressProvinceNew: 'AddressProvinceNew',
      addressProvinceContainerNew: 'AddressProvinceContainerNew',
      addressCountry: 'AddressCountry',
      addressProvince: 'AddressProvince',
      addressProvinceContainer: 'AddressProvinceContainer',
    };

    const classes$r = {
      hide: 'hide',
    };

    class Addresses {
      constructor(section) {
        this.section = section;
        this.addressNewForm = this.section.querySelector(selectors$S.addressNewForm);
        this.newButtons = this.section.querySelectorAll(selectors$S.btnNew);
        this.editButtons = this.section.querySelectorAll(selectors$S.btnEdit);
        this.deleteButtons = this.section.querySelectorAll(selectors$S.btnDelete);
        this.countrySelects = this.section.querySelectorAll(selectors$S.addressCountrySelect);

        if (this.addressNewForm) {
          this.customerAddresses();
          this.events();
        }
      }

      events() {
        if (this.newButtons.length) {
          this.newButtons.forEach((element) => {
            element.addEventListener('click', () => {
              this.addressNewForm.classList.toggle(classes$r.hide);
            });
          });
        }

        if (this.editButtons.length) {
          this.editButtons.forEach((element) => {
            element.addEventListener('click', () => {
              const formId = element.getAttribute(selectors$S.dataFormId);
              this.section.querySelector(`${selectors$S.editAddress}_${formId}`).classList.toggle(classes$r.hide);
            });
          });
        }

        if (this.deleteButtons.length) {
          this.deleteButtons.forEach((element) => {
            element.addEventListener('click', () => {
              const formId = element.getAttribute(selectors$S.dataFormId);
              const confirmMessage = element.getAttribute(selectors$S.dataConfirmMessage);
              if (confirm(confirmMessage || selectors$S.defaultConfirmMessage)) {
                Shopify.postLink(`${theme.routes.account_addresses_url}/${formId}`, {parameters: {_method: 'delete'}});
              }
            });
          });
        }
      }

      customerAddresses() {
        // Initialize observers on address selectors, defined in shopify_common.js
        if (Shopify.CountryProvinceSelector) {
          new Shopify.CountryProvinceSelector(selectors$S.addressCountryNew, selectors$S.addressProvinceNew, {
            hideElement: selectors$S.addressProvinceContainerNew,
          });
        }

        this.countrySelects.forEach((element) => {
          const formId = element.getAttribute(selectors$S.dataFormId);
          const countrySelector = `${selectors$S.addressCountry}_${formId}`;
          const provinceSelector = `${selectors$S.addressProvince}_${formId}`;
          const containerSelector = `${selectors$S.addressProvinceContainer}_${formId}`;

          new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
            hideElement: containerSelector,
          });
        });
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      const accountAddressTemplate = document.querySelector(selectors$S.templateAddresses);

      if (accountAddressTemplate) {
        new Addresses(accountAddressTemplate);
      }
    });

    const selectors$R = {
      form: '[data-account-form]',
      showReset: '[data-show-reset]',
      hideReset: '[data-hide-reset]',
      recover: '[data-recover-password]',
      login: '[data-login-form]',
      recoverHash: '#recover',
      hideClass: 'hide',
    };

    class Login {
      constructor(form) {
        this.showButton = form.querySelector(selectors$R.showReset);
        this.hideButton = form.querySelector(selectors$R.hideReset);
        this.recover = form.querySelector(selectors$R.recover);
        this.login = form.querySelector(selectors$R.login);

        this.init();
      }

      init() {
        if (window.location.hash == selectors$R.recoverHash) {
          this.showRecoverPasswordForm();
        } else {
          this.hideRecoverPasswordForm();
        }

        this.showButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.showRecoverPasswordForm();
        });

        this.hideButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.hideRecoverPasswordForm();
        });
      }

      showRecoverPasswordForm() {
        this.login.classList.add(selectors$R.hideClass);
        this.recover.classList.remove(selectors$R.hideClass);
        window.location.hash = selectors$R.recoverHash;
        return false;
      }

      hideRecoverPasswordForm() {
        this.recover.classList.add(selectors$R.hideClass);
        this.login.classList.remove(selectors$R.hideClass);
        window.location.hash = '';
        return false;
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      const loginForm = document.querySelector(selectors$R.form);

      if (loginForm) {
        new Login(loginForm);
      }
    });

    window.Shopify = window.Shopify || {};
    window.Shopify.theme = window.Shopify.theme || {};
    window.Shopify.theme.sections = window.Shopify.theme.sections || {};

    window.Shopify.theme.sections.registered = window.Shopify.theme.sections.registered || {};
    window.Shopify.theme.sections.instances = window.Shopify.theme.sections.instances || [];
    const registered = window.Shopify.theme.sections.registered;
    const instances = window.Shopify.theme.sections.instances;

    const selectors$Q = {
      id: 'data-section-id',
      type: 'data-section-type',
    };

    class Registration {
      constructor(type = null, components = []) {
        this.type = type;
        this.components = validateComponentsArray(components);
        this.callStack = {
          onLoad: [],
          onUnload: [],
          onSelect: [],
          onDeselect: [],
          onBlockSelect: [],
          onBlockDeselect: [],
          onReorder: [],
        };
        components.forEach((comp) => {
          for (const [key, value] of Object.entries(comp)) {
            const arr = this.callStack[key];
            if (Array.isArray(arr) && typeof value === 'function') {
              arr.push(value);
            } else {
              console.warn(`Unregisted function: '${key}' in component: '${this.type}'`);
              console.warn(value);
            }
          }
        });
      }

      getStack() {
        return this.callStack;
      }
    }

    class Section {
      constructor(container, registration) {
        this.container = validateContainerElement(container);
        this.id = container.getAttribute(selectors$Q.id);
        this.type = registration.type;
        this.callStack = registration.getStack();

        try {
          this.onLoad();
        } catch (e) {
          console.warn(`Error in section: ${this.id}`);
          console.warn(this);
          console.warn(e);
        }
      }

      callFunctions(key, e = null) {
        this.callStack[key].forEach((func) => {
          const props = {
            id: this.id,
            type: this.type,
            container: this.container,
          };
          if (e) {
            func.call(props, e);
          } else {
            func.call(props);
          }
        });
      }

      onLoad() {
        this.callFunctions('onLoad');
      }

      onUnload() {
        this.callFunctions('onUnload');
      }

      onSelect(e) {
        this.callFunctions('onSelect', e);
      }

      onDeselect(e) {
        this.callFunctions('onDeselect', e);
      }

      onBlockSelect(e) {
        this.callFunctions('onBlockSelect', e);
      }

      onBlockDeselect(e) {
        this.callFunctions('onBlockDeselect', e);
      }

      onReorder(e) {
        this.callFunctions('onReorder', e);
      }
    }

    function validateContainerElement(container) {
      if (!(container instanceof Element)) {
        throw new TypeError('Theme Sections: Attempted to load section. The section container provided is not a DOM element.');
      }
      if (container.getAttribute(selectors$Q.id) === null) {
        throw new Error('Theme Sections: The section container provided does not have an id assigned to the ' + selectors$Q.id + ' attribute.');
      }

      return container;
    }

    function validateComponentsArray(value) {
      if ((typeof value !== 'undefined' && typeof value !== 'object') || value === null) {
        throw new TypeError('Theme Sections: The components object provided is not a valid');
      }

      return value;
    }

    /*
     * @shopify/theme-sections
     * -----------------------------------------------------------------------------
     *
     * A framework to provide structure to your Shopify sections and a load and unload
     * lifecycle. The lifecycle is automatically connected to theme editor events so
     * that your sections load and unload as the editor changes the content and
     * settings of your sections.
     */

    function register(type, components) {
      if (typeof type !== 'string') {
        throw new TypeError('Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered');
      }

      if (typeof registered[type] !== 'undefined') {
        throw new Error('Theme Sections: A section of type "' + type + '" has already been registered. You cannot register the same section type twice');
      }

      if (!Array.isArray(components)) {
        components = [components];
      }

      const section = new Registration(type, components);
      registered[type] = section;

      return registered;
    }

    function load(types, containers) {
      types = normalizeType(types);

      if (typeof containers === 'undefined') {
        containers = document.querySelectorAll('[' + selectors$Q.type + ']');
      }

      containers = normalizeContainers(containers);

      types.forEach(function (type) {
        const registration = registered[type];

        if (typeof registration === 'undefined') {
          return;
        }

        containers = containers.filter(function (container) {
          // Filter from list of containers because container already has an instance loaded
          if (isInstance(container)) {
            return false;
          }

          // Filter from list of containers because container doesn't have data-section-type attribute
          if (container.getAttribute(selectors$Q.type) === null) {
            return false;
          }

          // Keep in list of containers because current type doesn't match
          if (container.getAttribute(selectors$Q.type) !== type) {
            return true;
          }

          instances.push(new Section(container, registration));

          // Filter from list of containers because container now has an instance loaded
          return false;
        });
      });
    }

    function unload(selector) {
      var instancesToUnload = getInstances(selector);

      instancesToUnload.forEach(function (instance) {
        var index = instances
          .map(function (e) {
            return e.id;
          })
          .indexOf(instance.id);
        instances.splice(index, 1);
        instance.onUnload();
      });
    }

    function reorder(selector) {
      var instancesToReorder = getInstances(selector);

      instancesToReorder.forEach(function (instance) {
        instance.onReorder();
      });
    }

    function getInstances(selector) {
      var filteredInstances = [];

      // Fetch first element if its an array
      if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
        var firstElement = selector[0];
      }

      // If selector element is DOM element
      if (selector instanceof Element || firstElement instanceof Element) {
        var containers = normalizeContainers(selector);

        containers.forEach(function (container) {
          filteredInstances = filteredInstances.concat(
            instances.filter(function (instance) {
              return instance.container === container;
            })
          );
        });

        // If select is type string
      } else if (typeof selector === 'string' || typeof firstElement === 'string') {
        var types = normalizeType(selector);

        types.forEach(function (type) {
          filteredInstances = filteredInstances.concat(
            instances.filter(function (instance) {
              return instance.type === type;
            })
          );
        });
      }

      return filteredInstances;
    }

    function getInstanceById(id) {
      var instance;

      for (var i = 0; i < instances.length; i++) {
        if (instances[i].id === id) {
          instance = instances[i];
          break;
        }
      }
      return instance;
    }

    function isInstance(selector) {
      return getInstances(selector).length > 0;
    }

    function normalizeType(types) {
      // If '*' then fetch all registered section types
      if (types === '*') {
        types = Object.keys(registered);

        // If a single section type string is passed, put it in an array
      } else if (typeof types === 'string') {
        types = [types];

        // If single section constructor is passed, transform to array with section
        // type string
      } else if (types.constructor === Section) {
        types = [types.prototype.type];

        // If array of typed section constructors is passed, transform the array to
        // type strings
      } else if (Array.isArray(types) && types[0].constructor === Section) {
        types = types.map(function (Section) {
          return Section.type;
        });
      }

      types = types.map(function (type) {
        return type.toLowerCase();
      });

      return types;
    }

    function normalizeContainers(containers) {
      // Nodelist with entries
      if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
        containers = Array.prototype.slice.call(containers);

        // Empty Nodelist
      } else if (NodeList.prototype.isPrototypeOf(containers) && containers.length === 0) {
        containers = [];

        // Handle null (document.querySelector() returns null with no match)
      } else if (containers === null) {
        containers = [];

        // Single DOM element
      } else if (!Array.isArray(containers) && containers instanceof Element) {
        containers = [containers];
      }

      return containers;
    }

    if (window.Shopify.designMode) {
      document.addEventListener('shopify:section:load', function (event) {
        var id = event.detail.sectionId;
        var container = event.target.querySelector('[' + selectors$Q.id + '="' + id + '"]');

        if (container !== null) {
          load(container.getAttribute(selectors$Q.type), container);
        }
      });

      document.addEventListener('shopify:section:reorder', function (event) {
        var id = event.detail.sectionId;
        var container = event.target.querySelector('[' + selectors$Q.id + '="' + id + '"]');
        var instance = getInstances(container)[0];

        if (typeof instance === 'object') {
          reorder(container);
        }
      });

      document.addEventListener('shopify:section:unload', function (event) {
        var id = event.detail.sectionId;
        var container = event.target.querySelector('[' + selectors$Q.id + '="' + id + '"]');
        var instance = getInstances(container)[0];

        if (typeof instance === 'object') {
          unload(container);
        }
      });

      document.addEventListener('shopify:section:select', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onSelect(event);
        }
      });

      document.addEventListener('shopify:section:deselect', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onDeselect(event);
        }
      });

      document.addEventListener('shopify:block:select', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onBlockSelect(event);
        }
      });

      document.addEventListener('shopify:block:deselect', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onBlockDeselect(event);
        }
      });
    }

    /**
     * A11y Helpers
     * -----------------------------------------------------------------------------
     * A collection of useful functions that help make your theme more accessible
     */

    /**
     * Moves focus to an HTML element
     * eg for In-page links, after scroll, focus shifts to content area so that
     * next `tab` is where user expects. Used in bindInPageLinks()
     * eg move focus to a modal that is opened. Used in trapFocus()
     *
     * @param {Element} container - Container DOM element to trap focus inside of
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     */
    function forceFocus(element, options) {
      options = options || {};

      element.focus();
      if (typeof options.className !== 'undefined') {
        element.classList.add(options.className);
      }
      element.addEventListener('blur', callback);

      function callback(event) {
        event.target.removeEventListener(event.type, callback);

        if (typeof options.className !== 'undefined') {
          element.classList.remove(options.className);
        }
      }
    }

    /**
     * If there's a hash in the url, focus the appropriate element
     * This compensates for older browsers that do not move keyboard focus to anchor links.
     * Recommendation: To be called once the page in loaded.
     *
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     * @param {string} options.ignore - Selector for elements to not include.
     */

    function focusHash(options) {
      options = options || {};
      var hash = window.location.hash;
      var element = document.getElementById(hash.slice(1));

      // if we are to ignore this element, early return
      if (element && options.ignore && element.matches(options.ignore)) {
        return false;
      }

      if (hash && element) {
        forceFocus(element, options);
      }
    }

    /**
     * When an in-page (url w/hash) link is clicked, focus the appropriate element
     * This compensates for older browsers that do not move keyboard focus to anchor links.
     * Recommendation: To be called once the page in loaded.
     *
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     * @param {string} options.ignore - CSS selector for elements to not include.
     */

    function bindInPageLinks(options) {
      options = options || {};
      var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));

      function queryCheck(selector) {
        return document.getElementById(selector) !== null;
      }

      return links.filter(function (link) {
        if (link.hash === '#' || link.hash === '') {
          return false;
        }

        if (options.ignore && link.matches(options.ignore)) {
          return false;
        }

        if (!queryCheck(link.hash.substr(1))) {
          return false;
        }

        var element = document.querySelector(link.hash);

        if (!element) {
          return false;
        }

        link.addEventListener('click', function () {
          forceFocus(element, options);
        });

        return true;
      });
    }

    function focusable(container) {
      var elements = Array.prototype.slice.call(
        container.querySelectorAll(
          '[tabindex],' + '[draggable],' + 'a[href],' + 'area,' + 'button:enabled,' + 'input:not([type=hidden]):enabled,' + 'object,' + 'select:enabled,' + 'textarea:enabled' + '[data-focus-element]'
        )
      );

      // Filter out elements that are not visible.
      // Copied from jQuery https://github.com/jquery/jquery/blob/2d4f53416e5f74fa98e0c1d66b6f3c285a12f0ce/src/css/hiddenVisibleSelectors.js
      return elements.filter(function (element) {
        return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
      });
    }

    /**
     * Traps the focus in a particular container
     *
     * @param {Element} container - Container DOM element to trap focus inside of
     * @param {Element} elementToFocus - Element to be focused on first
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     */

    var trapFocusHandlers = {};

    function trapFocus(container, options) {
      options = options || {};
      var elements = focusable(container);
      var elementToFocus = options.elementToFocus || container;
      var first = elements[0];
      var last = elements[elements.length - 1];

      removeTrapFocus();

      trapFocusHandlers.focusin = function (event) {
        if (container !== event.target && !container.contains(event.target) && first) {
          first.focus();
        }

        if (event.target !== container && event.target !== last && event.target !== first) return;
        document.addEventListener('keydown', trapFocusHandlers.keydown);
      };

      trapFocusHandlers.focusout = function () {
        document.removeEventListener('keydown', trapFocusHandlers.keydown);
      };

      trapFocusHandlers.keydown = function (event) {
        if (event.keyCode !== 9) return; // If not TAB key

        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
          event.preventDefault();
          first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if ((event.target === container || event.target === first) && event.shiftKey) {
          event.preventDefault();
          last.focus();
        }
      };

      document.addEventListener('focusout', trapFocusHandlers.focusout);
      document.addEventListener('focusin', trapFocusHandlers.focusin);

      forceFocus(elementToFocus, options);
    }

    /**
     * Removes the trap of focus from the page
     */
    function removeTrapFocus() {
      document.removeEventListener('focusin', trapFocusHandlers.focusin);
      document.removeEventListener('focusout', trapFocusHandlers.focusout);
      document.removeEventListener('keydown', trapFocusHandlers.keydown);
    }

    /**
     * Add a preventive message to external links and links that open to a new window.
     * @param {string} elements - Specific elements to be targeted
     * @param {object} options.messages - Custom messages to overwrite with keys: newWindow, external, newWindowExternal
     * @param {string} options.messages.newWindow - When the link opens in a new window (e.g. target="_blank")
     * @param {string} options.messages.external - When the link is to a different host domain.
     * @param {string} options.messages.newWindowExternal - When the link is to a different host domain and opens in a new window.
     * @param {object} options.prefix - Prefix to namespace "id" of the messages
     */
    function accessibleLinks(elements, options) {
      if (typeof elements !== 'string') {
        throw new TypeError(elements + ' is not a String.');
      }

      elements = document.querySelectorAll(elements);

      if (elements.length === 0) {
        return;
      }

      options = options || {};
      options.messages = options.messages || {};

      var messages = {
        newWindow: options.messages.newWindow || 'Opens in a new window.',
        external: options.messages.external || 'Opens external website.',
        newWindowExternal: options.messages.newWindowExternal || 'Opens external website in a new window.',
      };

      var prefix = options.prefix || 'a11y';

      var messageSelectors = {
        newWindow: prefix + '-new-window-message',
        external: prefix + '-external-message',
        newWindowExternal: prefix + '-new-window-external-message',
      };

      function generateHTML(messages) {
        var container = document.createElement('ul');
        var htmlMessages = Object.keys(messages).reduce(function (html, key) {
          return (html += '<li id=' + messageSelectors[key] + '>' + messages[key] + '</li>');
        }, '');

        container.setAttribute('hidden', true);
        container.innerHTML = htmlMessages;

        document.body.appendChild(container);
      }

      function externalSite(link) {
        return link.hostname !== window.location.hostname;
      }

      elements.forEach(function (link) {
        var target = link.getAttribute('target');
        var rel = link.getAttribute('rel');
        var isExternal = externalSite(link);
        var isTargetBlank = target === '_blank';
        var missingRelNoopener = rel === null || rel.indexOf('noopener') === -1;

        if (isTargetBlank && missingRelNoopener) {
          var relValue = rel === null ? 'noopener' : rel + ' noopener';
          link.setAttribute('rel', relValue);
        }

        if (isExternal && isTargetBlank) {
          link.setAttribute('aria-describedby', messageSelectors.newWindowExternal);
        } else if (isExternal) {
          link.setAttribute('aria-describedby', messageSelectors.external);
        } else if (isTargetBlank) {
          link.setAttribute('aria-describedby', messageSelectors.newWindow);
        }
      });

      generateHTML(messages);
    }

    var a11y = /*#__PURE__*/Object.freeze({
        __proto__: null,
        forceFocus: forceFocus,
        focusHash: focusHash,
        bindInPageLinks: bindInPageLinks,
        focusable: focusable,
        trapFocus: trapFocus,
        removeTrapFocus: removeTrapFocus,
        accessibleLinks: accessibleLinks
    });

    var selectors$P = {
      drawerWrappper: 'data-drawer',
      drawerScrolls: '[data-scroll-lock-scrollable]',
      underlay: '[data-drawer-underlay]',
      stagger: '[data-stagger-animation]',
      outer: '[data-header-wrapper]',
      drawerToggle: 'data-drawer-toggle',
      focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    var classes$q = {
      isOpenOuter: 'has-drawer-open',
      isVisible: 'drawer--visible',
      displayNone: 'display-none',
      showMobile: 'js__show__mobile',
    };

    var sections$q = {};

    class Drawer {
      constructor(el) {
        this.drawer = el;
        this.drawerScrolls = this.drawer.querySelector(selectors$P.drawerScrolls);
        this.underlay = this.drawer.querySelector(selectors$P.underlay);
        this.key = this.drawer.dataset.drawer;
        const btnSelector = `[${selectors$P.drawerToggle}='${this.key}']`;
        this.buttons = document.querySelectorAll(btnSelector);
        this.staggers = this.drawer.querySelectorAll(selectors$P.stagger);
        this.outer = this.drawer.closest(selectors$P.outer);

        this.connectToggle();
        this.connectDrawer();
        this.closers();
        this.staggerChildAnimations();
        this.closeDrawerOnLargeScreens();
      }

      unload() {
        // wipe listeners
      }

      connectToggle() {
        this.buttons.forEach((btn) => {
          btn.addEventListener(
            'click',
            function (e) {
              e.preventDefault();
              this.drawer.dispatchEvent(
                new CustomEvent('theme:drawer:toggle', {
                  bubbles: false,
                })
              );
            }.bind(this)
          );
        });
      }

      connectDrawer() {
        this.drawer.addEventListener(
          'theme:drawer:toggle',
          function () {
            if (this.drawer.classList.contains(classes$q.isVisible)) {
              this.drawer.dispatchEvent(
                new CustomEvent('theme:drawer:close', {
                  bubbles: false,
                })
              );
            } else {
              this.drawer.dispatchEvent(
                new CustomEvent('theme:drawer:open', {
                  bubbles: false,
                })
              );
            }
          }.bind(this)
        );
        this.drawer.addEventListener('theme:drawer:close', this.hideDrawer.bind(this));
        this.drawer.addEventListener('theme:drawer:open', this.showDrawer.bind(this));
      }

      staggerChildAnimations() {
        this.staggers.forEach((el) => {
          const children = el.querySelectorAll(':scope > * > * > [data-animates]');
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 50 + 10}ms`;
          });
        });
      }

      closers() {
        this.drawer.addEventListener(
          'keyup',
          function (evt) {
            if (evt.which !== window.theme.keyboardKeys.ESCAPE) {
              return;
            }
            this.hideDrawer();
            this.buttons[0].focus();
          }.bind(this)
        );

        this.underlay.addEventListener(
          'click',
          function () {
            this.hideDrawer();
          }.bind(this)
        );
      }

      showDrawer() {
        // animates after display none is removed
        setTimeout(() => {
          this.drawer.classList.remove(classes$q.displayNone);
          this.buttons.forEach((el) => el.setAttribute('aria-expanded', true));
          this.drawer.classList.add(classes$q.isVisible);
          if (this.drawerScrolls) {
            document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
          }
          const firstFocus = this.drawer.querySelector(selectors$P.focusable);
          trapFocus(this.drawer, {elementToFocus: firstFocus});
        }, 1);

        if (this.key === 'hamburger') {
          document.querySelector(`[${selectors$P.drawerWrappper}="drawer-cart"]`).classList.remove(classes$q.isVisible);
          this.outer.classList.add(classes$q.isOpenOuter);
        }

        if (this.key === 'drawer-cart') {
          document.querySelector(`[${selectors$P.drawerWrappper}="hamburger"]`).classList.remove(classes$q.isVisible);
          document.querySelector(`[${selectors$P.drawerWrappper}="hamburger"]`).closest(selectors$P.outer).classList.remove(classes$q.isOpenOuter);
        }
      }

      hideDrawer() {
        this.buttons.forEach((el) => el.setAttribute('aria-expanded', true));
        this.drawer.classList.remove(classes$q.isVisible);
        if (this.drawerScrolls) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }

        document.dispatchEvent(new CustomEvent('theme:sliderule:close', {bubbles: false}));
        removeTrapFocus();

        // adds display none after animations
        setTimeout(() => {
          if (!this.drawer.classList.contains(classes$q.isVisible)) {
            this.drawer.classList.add(classes$q.displayNone);
          }
        }, 800);
        if (this.key === 'hamburger') {
          this.outer.classList.remove(classes$q.isOpenOuter);
        }
      }

      closeDrawerOnLargeScreens() {
        // Close menu-drawer on resize/orientationchange on larger screens if it happens to be open
        document.addEventListener('theme:resize:width', () => {
          if (!this.outer.classList.contains(classes$q.showMobile) && this.outer.classList.contains(classes$q.isOpenOuter)) {
            this.drawer.dispatchEvent(
              new CustomEvent('theme:drawer:close', {
                bubbles: false,
              })
            );
          }
        });
      }
    }

    const drawer = {
      onLoad() {
        sections$q[this.id] = [];
        const els = this.container.querySelectorAll(`[${selectors$P.drawerWrappper}]`);
        els.forEach((el) => {
          sections$q[this.id].push(new Drawer(el));
        });
      },
      onUnload: function () {
        sections$q[this.id].forEach((el) => {
          if (typeof el.unload === 'function') {
            el.unload();
          }
        });
      },
    };

    const selectors$O = {
      announcement: '[data-announcement-wrapper]',
      transparent: 'data-header-transparent',
      header: '[data-header-wrapper] header',
      headerIsNotFixed: '[data-header-sticky="false"]',
    };

    const classes$p = {
      stuck: 'js__header__stuck',
      stuckAnimated: 'js__header__stuck--animated',
      triggerAnimation: 'js__header__stuck--trigger-animation',
      stuckBackdrop: 'js__header__stuck__backdrop',
      headerIsNotVisible: 'is-not-visible',
      hasStickyHeader: 'has-sticky-header',
    };

    let sections$p = {};

    class Sticky {
      constructor(el) {
        this.wrapper = el;
        this.type = this.wrapper.dataset.headerSticky;
        this.sticks = this.type === 'true';
        this.static = this.type === 'false';
        this.win = window;
        this.animated = this.type === 'directional';
        this.currentlyStuck = false;
        this.cls = this.wrapper.classList;
        const announcementEl = document.querySelector(selectors$O.announcement);
        const announcementHeight = announcementEl ? announcementEl.clientHeight : 0;
        this.headerHeight = document.querySelector(selectors$O.header).clientHeight;
        this.blur = this.headerHeight + announcementHeight;
        this.stickDown = this.headerHeight + announcementHeight;
        this.stickUp = announcementHeight;
        this.scrollEventStatic = () => this.checkIsVisible();
        this.scrollEventListen = (e) => this.listenScroll(e);
        this.scrollEventUpListen = () => this.scrollUpDirectional();
        this.scrollEventDownListen = () => this.scrollDownDirectional();
        if (this.wrapper.getAttribute(selectors$O.transparent) !== 'false') {
          this.blur = announcementHeight;
        }
        if (this.sticks) {
          this.stickDown = announcementHeight;
          this.scrollDownInit();
          document.body.classList.add(classes$p.hasStickyHeader);
        } else {
          document.body.classList.remove(classes$p.hasStickyHeader);
        }

        if (this.static) {
          document.addEventListener('theme:scroll', this.scrollEventStatic);
        }

        this.listen();
      }

      unload() {
        if (this.sticks || this.animated) {
          document.removeEventListener('theme:scroll', this.scrollEventListen);
        }

        if (this.animated) {
          document.removeEventListener('theme:scroll:up', this.scrollEventUpListen);
          document.removeEventListener('theme:scroll:down', this.scrollEventDownListen);
        }

        if (this.static) {
          document.removeEventListener('theme:scroll', this.scrollEventStatic);
        }
      }

      listen() {
        if (this.sticks || this.animated) {
          document.addEventListener('theme:scroll', this.scrollEventListen);
        }

        if (this.animated) {
          document.addEventListener('theme:scroll:up', this.scrollEventUpListen);
          document.addEventListener('theme:scroll:down', this.scrollEventDownListen);
        }
      }

      listenScroll(e) {
        if (e.detail.down) {
          if (!this.currentlyStuck && e.detail.position > this.stickDown) {
            this.stickSimple();
          }
          if (!this.currentlyBlurred && e.detail.position > this.blur) {
            this.addBlur();
          }
        } else {
          if (e.detail.position <= this.stickUp) {
            this.unstickSimple();
          }
          if (e.detail.position <= this.blur) {
            this.removeBlur();
          }
        }
      }

      stickSimple() {
        if (this.animated) {
          this.cls.add(classes$p.stuckAnimated);
        }
        this.cls.add(classes$p.stuck);
        this.wrapper.setAttribute(selectors$O.transparent, false);
        this.currentlyStuck = true;
      }

      unstickSimple() {
        if (!document.documentElement.hasAttribute('data-scroll-locked')) {
          // check for scroll lock
          this.cls.remove(classes$p.stuck);
          this.wrapper.setAttribute(selectors$O.transparent, theme.transparentHeader);
          if (this.animated) {
            this.cls.remove(classes$p.stuckAnimated);
          }
          this.currentlyStuck = false;
        }
      }

      scrollDownInit() {
        if (window.scrollY > this.stickDown) {
          this.stickSimple();
        }
        if (window.scrollY > this.blur) {
          this.addBlur();
        }
      }

      stickDirectional() {
        this.cls.add(classes$p.triggerAnimation);
      }

      unstickDirectional() {
        this.cls.remove(classes$p.triggerAnimation);
      }

      scrollDownDirectional() {
        this.unstickDirectional();
      }

      scrollUpDirectional() {
        if (window.scrollY <= this.stickDown) {
          this.unstickDirectional();
        } else {
          this.stickDirectional();
        }
      }

      addBlur() {
        this.cls.add(classes$p.stuckBackdrop);
        this.currentlyBlurred = true;
      }

      removeBlur() {
        this.cls.remove(classes$p.stuckBackdrop);
        this.currentlyBlurred = false;
      }

      checkIsVisible() {
        const header = document.querySelector(selectors$O.headerIsNotFixed);
        const currentScroll = this.win.pageYOffset;

        if (header) {
          header.classList.toggle(classes$p.headerIsNotVisible, currentScroll >= this.headerHeight);
        }
      }
    }

    const stickyHeader = {
      onLoad() {
        sections$p = new Sticky(this.container);
      },
      onUnload: function () {
        if (typeof sections$p.unload === 'function') {
          sections$p.unload();
        }
      },
    };

    const selectors$N = {
      disclosureToggle: 'data-hover-disclosure-toggle',
      disclosureWrappper: '[data-hover-disclosure]',
      link: '[data-top-link]',
      wrapper: '[data-header-wrapper]',
      stagger: '[data-stagger]',
      staggerPair: '[data-stagger-first]',
      staggerAfter: '[data-stagger-second]',
      focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    const classes$o = {
      isVisible: 'is-visible',
      meganavVisible: 'meganav--visible',
      meganavIsTransitioning: 'meganav--is-transitioning',
    };

    let sections$o = {};
    let disclosures = {};
    class HoverDisclosure {
      constructor(el) {
        this.disclosure = el;
        this.wrapper = el.closest(selectors$N.wrapper);
        this.key = this.disclosure.id;
        this.trigger = document.querySelector(`[${selectors$N.disclosureToggle}='${this.key}']`);
        this.link = this.trigger.querySelector(selectors$N.link);
        this.grandparent = this.trigger.classList.contains('grandparent');
        this.transitionTimeout = 0;

        this.trigger.setAttribute('aria-haspopup', true);
        this.trigger.setAttribute('aria-expanded', false);
        this.trigger.setAttribute('aria-controls', this.key);

        this.connectHoverToggle();
        this.handleTablets();
        this.staggerChildAnimations();
      }

      onBlockSelect(evt) {
        if (this.disclosure.contains(evt.target)) {
          this.showDisclosure(evt);
        }
      }

      onBlockDeselect(evt) {
        if (this.disclosure.contains(evt.target)) {
          this.hideDisclosure();
        }
      }

      showDisclosure(e) {
        if (e && e.type && e.type === 'mouseenter') {
          this.wrapper.classList.add(classes$o.meganavIsTransitioning);
        }

        if (this.grandparent) {
          this.wrapper.classList.add(classes$o.meganavVisible);
        } else {
          this.wrapper.classList.remove(classes$o.meganavVisible);
        }
        this.trigger.setAttribute('aria-expanded', true);
        this.trigger.classList.add(classes$o.isVisible);
        this.disclosure.classList.add(classes$o.isVisible);

        if (this.transitionTimeout) {
          clearTimeout(this.transitionTimeout);
        }

        this.transitionTimeout = setTimeout(() => {
          this.wrapper.classList.remove(classes$o.meganavIsTransitioning);
        }, 200);
      }

      hideDisclosure() {
        this.disclosure.classList.remove(classes$o.isVisible);
        this.trigger.classList.remove(classes$o.isVisible);
        this.trigger.setAttribute('aria-expanded', false);
        this.wrapper.classList.remove(classes$o.meganavVisible, classes$o.meganavIsTransitioning);
      }

      staggerChildAnimations() {
        const simple = this.disclosure.querySelectorAll(selectors$N.stagger);
        simple.forEach((el, index) => {
          el.style.transitionDelay = `${index * 50 + 10}ms`;
        });

        const pairs = this.disclosure.querySelectorAll(selectors$N.staggerPair);
        pairs.forEach((child, i) => {
          const d1 = i * 150;
          child.style.transitionDelay = `${d1}ms`;
          child.parentElement.querySelectorAll(selectors$N.staggerAfter).forEach((grandchild, i2) => {
            const di1 = i2 + 1;
            const d2 = di1 * 20;
            grandchild.style.transitionDelay = `${d1 + d2}ms`;
          });
        });
      }

      handleTablets() {
        // first click opens the popup, second click opens the link
        this.trigger.addEventListener(
          'touchstart',
          function (e) {
            const isOpen = this.disclosure.classList.contains(classes$o.isVisible);
            if (!isOpen) {
              e.preventDefault();
              this.showDisclosure(e);
            }
          }.bind(this),
          {passive: true}
        );
      }

      connectHoverToggle() {
        this.trigger.addEventListener('mouseenter', (e) => this.showDisclosure(e));
        this.link.addEventListener('focus', (e) => this.showDisclosure(e));

        this.trigger.addEventListener('mouseleave', () => this.hideDisclosure());
        this.trigger.addEventListener('focusout', (e) => {
          const inMenu = this.trigger.contains(e.relatedTarget);
          if (!inMenu) {
            this.hideDisclosure();
          }
        });
        this.disclosure.addEventListener('keyup', (evt) => {
          if (evt.which !== window.theme.keyboardKeys.ESCAPE) {
            return;
          }
          this.hideDisclosure();
        });
      }
    }

    const hoverDisclosure = {
      onLoad() {
        sections$o[this.id] = [];
        disclosures = this.container.querySelectorAll(selectors$N.disclosureWrappper);
        disclosures.forEach((el) => {
          sections$o[this.id].push(new HoverDisclosure(el));
        });
      },
      onBlockSelect(evt) {
        sections$o[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(evt);
          }
        });
      },
      onBlockDeselect(evt) {
        sections$o[this.id].forEach((el) => {
          if (typeof el.onBlockDeselect === 'function') {
            el.onBlockDeselect(evt);
          }
        });
      },
    };

    const selectors$M = {
      count: 'data-cart-count',
    };

    class Totals {
      constructor(el) {
        this.section = el;
        this.counts = this.section.querySelectorAll(`[${selectors$M.count}]`);
        this.cart = null;
        this.listen();
      }

      listen() {
        document.addEventListener(
          'theme:cart:change',
          function (event) {
            this.cart = event.detail.cart;
            this.update();
          }.bind(this)
        );
      }

      update() {
        if (this.cart) {
          this.counts.forEach((count) => {
            count.setAttribute(selectors$M.count, this.cart.item_count);
            count.innerHTML = `${this.cart.item_count}`;
          });
        }
      }
    }
    const headerTotals = {
      onLoad() {
        new Totals(this.container);
      },
    };

    function FetchError(object) {
      this.status = object.status || null;
      this.headers = object.headers || null;
      this.json = object.json || null;
      this.body = object.body || null;
    }
    FetchError.prototype = Error.prototype;

    const slideDown = (target, duration = 500, checkHidden = true) => {
      let display = window.getComputedStyle(target).display;
      if (checkHidden && display !== 'none') {
        return;
      }
      target.style.removeProperty('display');
      if (display === 'none') display = 'block';
      target.style.display = display;
      let height = target.offsetHeight;
      target.classList.add('is-transitioning');
      target.style.overflow = 'hidden';
      target.style.height = 0;
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;
      target.offsetHeight;
      target.style.boxSizing = 'border-box';
      target.style.transitionTimingFunction = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
      target.style.transitionProperty = 'height, margin, padding';
      target.style.transitionDuration = duration + 'ms';
      target.style.height = height + 'px';
      target.style.removeProperty('padding-top');
      target.style.removeProperty('padding-bottom');
      target.style.removeProperty('margin-top');
      target.style.removeProperty('margin-bottom');
      window.setTimeout(() => {
        target.style.removeProperty('height');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
        target.style.removeProperty('transition-timing-function');
        target.classList.remove('is-transitioning');
      }, duration);
    };

    const slideUp = (target, duration = 500) => {
      target.classList.add('is-transitioning');
      target.style.transitionProperty = 'height, margin, padding';
      target.style.transitionTimingFunction = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
      target.style.transitionDuration = duration + 'ms';
      target.style.boxSizing = 'border-box';
      target.style.height = target.offsetHeight + 'px';
      target.offsetHeight;
      target.style.overflow = 'hidden';
      target.style.height = 0;
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;
      window.setTimeout(() => {
        target.style.display = 'none';
        target.style.removeProperty('height');
        target.style.removeProperty('padding-top');
        target.style.removeProperty('padding-bottom');
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
        target.style.removeProperty('transition-timing-function');
        target.classList.remove('is-transitioning');
      }, duration);
    };

    const selectors$L = {
      cartNote: '[data-cart-note]',
    };

    class CartNotes {
      constructor(element) {
        this.inputs = element.querySelectorAll(selectors$L.cartNote);
        this.initInputs();
      }

      initInputs() {
        this.inputs.forEach((input) => {
          input.addEventListener(
            'input',
            debounce$1(
              function (e) {
                const note = e.target.value.toString() || '';
                this.saveNotes(note);
              }.bind(this),
              300
            )
          );
        });
      }

      saveNotes(newNote) {
        window
          .fetch(`${window.theme.routes.cart}/update.js`, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({note: newNote}),
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }

    const getUrlString = (params, keys = [], isArray = false) => {
      const p = Object.keys(params)
        .map((key) => {
          let val = params[key];

          if (Object.prototype.toString.call(val) === '[object Object]' || Array.isArray(val)) {
            if (Array.isArray(params)) {
              keys.push('');
            } else {
              keys.push(key);
            }
            return getUrlString(val, keys, Array.isArray(val));
          } else {
            let tKey = key;

            if (keys.length > 0) {
              const tKeys = isArray ? keys : [...keys, key];
              tKey = tKeys.reduce((str, k) => {
                return str === '' ? k : `${str}[${k}]`;
              }, '');
            }
            if (isArray) {
              return `${tKey}[]=${val}`;
            } else {
              return `${tKey}=${val}`;
            }
          }
        })
        .join('&');

      keys.pop();
      return p;
    };

    const selectors$K = {
      submitButton: '[data-submit-shipping]',
      form: '[data-shipping-estimate-form]',
      template: '[data-response-template]',
      country: '#estimate_address_country',
      province: '#estimate_address_province',
      zip: '#estimate_address_zip',
      wrapper: '[data-response-wrapper]',
      defaultData: 'data-default-fullname',
    };

    const classes$n = {
      success: 'shipping--success',
      error: 'errors',
    };

    class ShippingCalculator {
      constructor(section) {
        this.button = section.container.querySelector(selectors$K.submitButton);
        this.template = section.container.querySelector(selectors$K.template).innerHTML;
        this.ratesWrapper = section.container.querySelector(selectors$K.wrapper);
        this.form = section.container.querySelector(selectors$K.form);
        this.country = section.container.querySelector(selectors$K.country);
        this.province = section.container.querySelector(selectors$K.province);
        this.zip = section.container.querySelector(selectors$K.zip);
        this.init();
      }

      enableButtons() {
        this.button.removeAttribute('disabled');
        this.button.classList.remove('disabled');
      }

      disableButtons() {
        this.button.setAttribute('disabled', 'disabled');
        this.button.classList.add('disabled');
      }

      render(rates) {
        if (this.template && this.ratesWrapper) {
          const rendered = Sqrl__namespace.render(this.template, rates);
          this.ratesWrapper.innerHTML = rendered;
        }
        this.enableButtons();
        this.ratesWrapper.style.removeProperty('display');
      }

      estimate(shipping_address) {
        const encodedShippingAddressData = encodeURI(
          getUrlString({
            shipping_address: shipping_address,
          })
        );
        const url = `${window.theme.routes.cart}/shipping_rates.json?${encodedShippingAddressData}`;
        const instance = this;
        axios
          .get(url)
          .then(function (response) {
            // handle success
            const items = instance.sanitize(response);
            instance.render(items);
            instance.enableButtons();
            instance.ratesWrapper.style.removeProperty('display');
          })
          .catch(function (error) {
            // handle errors
            const errors = instance.sanitizeErrors(error);
            instance.render(errors);
          });
      }

      sanitize(response) {
        const sanitized = {};
        sanitized.class = classes$n.success;
        sanitized.items = [];
        if (response.data.shipping_rates && response.data.shipping_rates.length > 0) {
          const rates = response.data.shipping_rates;
          rates.forEach((r) => {
            let item = {};
            item.title = r.presentment_name;
            item.value = themeCurrency.formatMoney(r.price, theme.moneyFormat);
            sanitized.items.push(item);
          });
        } else {
          sanitized.items[0] = {value: theme.strings.noShippingAvailable};
        }
        return sanitized;
      }

      sanitizeErrors(response) {
        const errors = {};
        errors.class = classes$n.error;
        errors.items = [];
        if (typeof response.data === 'object') {
          for (const [key, value] of Object.entries(response.data)) {
            let item = {};
            item.title = key.toString();
            item.value = value.toString();
            errors.items.push(item);
          }
        } else {
          errors.items[0] = {value: theme.strings.noShippingAvailable};
        }
        return errors;
      }

      init() {
        const htmlEl = document.querySelector('html');
        let locale = 'en';
        if (htmlEl.hasAttribute('lang') && htmlEl.getAttribute('lang') !== '') {
          locale = htmlEl.getAttribute('lang');
        }

        if (this.form) {
          themeAddresses.AddressForm(this.form, locale, {
            shippingCountriesOnly: true,
          });
        }

        if (this.country && this.country.hasAttribute('data-default') && this.province && this.province.hasAttribute('data-default')) {
          this.country.addEventListener('change', function () {
            this.country.removeAttribute('data-default');
            this.province.removeAttribute('data-default');
          });
        }

        if (this.button) {
          this.button.addEventListener(
            'click',
            function (e) {
              e.preventDefault();
              this.disableButtons();
              while (this.ratesWrapper.firstChild) this.ratesWrapper.removeChild(this.ratesWrapper.firstChild);
              this.ratesWrapper.style.display = 'none';
              const shippingAddress = {};
              let elemCountryVal = this.country.value;
              let elemProvinceVal = this.province.value;
              const elemCountryData = this.country.getAttribute(selectors$K.defaultData);
              if (elemCountryVal === '' && elemCountryData && elemCountryData !== '') {
                elemCountryVal = elemCountryData;
              }
              const elemProvinceData = this.province.getAttribute(selectors$K.defaultData);
              if (elemProvinceVal === '' && elemProvinceData && elemProvinceData !== '') {
                elemProvinceVal = elemProvinceData;
              }
              shippingAddress.zip = this.zip.value || '';
              shippingAddress.country = elemCountryVal || '';
              shippingAddress.province = elemProvinceVal || '';
              this.estimate(shippingAddress);
            }.bind(this)
          );
        }
      }
    }

    const selectors$J = {
      cartMessage: '[data-cart-message]',
      cartMessageValue: 'data-cart-message',
      leftToSpend: '[data-left-to-spend]',
      cartProgress: '[data-cart-progress]',
    };

    const classes$m = {
      isHidden: 'is-hidden',
      isSuccess: 'is-success',
    };

    class CartShippingMessage {
      constructor(section) {
        this.container = section;
        this.cartMessage = this.container.querySelectorAll(selectors$J.cartMessage);
        if (this.cartMessage.length > 0) {
          this.init();
        }
      }

      init() {
        this.cartFreeLimitShipping = Number(this.cartMessage[0].getAttribute('data-limit')) * 100;
        this.cartFreeLimitShipping *= window.Shopify.currency.rate;
        this.shippingAmount = 0;

        this.cartBarProgress();
        this.listen();
      }

      listen() {
        document.addEventListener(
          'theme:cart:change',
          function (event) {
            this.cart = event.detail.cart;
            this.render();
          }.bind(this)
        );
      }

      render() {
        if (this.cart && this.cart.total_price) {
          const totalPrice = this.cart.total_price;
          this.freeShippingMessageHandle(totalPrice);

          // Build cart again if the quantity of the changed product is 0 or cart discounts are changed
          if (this.cartMessage.length > 0) {
            this.shippingAmount = totalPrice;
            this.updateProgress();
          }
        }
      }

      freeShippingMessageHandle(total) {
        if (this.cartMessage.length > 0) {
          this.container.querySelectorAll(selectors$J.cartMessage).forEach((message) => {
            const hasFreeShipping = message.hasAttribute(selectors$J.cartMessageValue) && message.getAttribute(selectors$J.cartMessageValue) === 'true' && total !== 0;
            const cartMessageClass = hasFreeShipping ? classes$m.isSuccess : classes$m.isHidden;

            message.classList.toggle(cartMessageClass, total >= this.cartFreeLimitShipping);
          });
        }
      }

      cartBarProgress(progress = null) {
        this.container.querySelectorAll(selectors$J.cartProgress).forEach((element) => {
          this.setProgress(element, progress === null ? element.getAttribute('data-percent') : progress);
        });
      }

      setProgress(holder, percent) {
        holder.style.setProperty('--bar-progress', `${percent}%`);
      }

      updateProgress() {
        const newPercentValue = (this.shippingAmount / this.cartFreeLimitShipping) * 100;
        const leftToSpend = theme.settings.currency_code_enable
          ? themeCurrency.formatMoney(this.cartFreeLimitShipping - this.shippingAmount, theme.moneyFormat) + ` ${theme.currencyCode}`
          : themeCurrency.formatMoney(this.cartFreeLimitShipping - this.shippingAmount, theme.moneyFormat);

        this.container.querySelectorAll(selectors$J.leftToSpend).forEach((element) => {
          element.innerHTML = leftToSpend.replace('.00', '');
        });

        this.cartBarProgress(newPercentValue > 100 ? 100 : newPercentValue);
      }
    }

    let sections$n = {};

    const selectors$I = {
      wrapper: '[data-add-action-wrapper]',
      addButton: '[data-add-to-cart]',
      errors: '[data-add-action-errors]',
      addVariantDetached: 'data-add-to-cart-variant',
      drawer: '[data-drawer="drawer-cart"]',
      cartPage: '[data-ajax-disable]',
      checkoutButton: '[data-checkout-button]',
    };

    const classes$l = {
      loading: 'loading',
      success: 'has-success',
      open: 'is-open',
    };

    class ProductAddButton$1 {
      constructor(wrapper, reloadCart = false) {
        this.wrapper = wrapper;
        this.button = wrapper.querySelector(selectors$I.addButton);
        this.errors = wrapper.querySelector(selectors$I.errors);
        this.drawer = document.querySelector(selectors$I.drawer);

        this.reloadCart = reloadCart;
        if (document.querySelector(selectors$I.cartPage)) {
          this.reloadCart = true;
        }

        if (this.button) {
          const isDetached = this.button.hasAttribute(selectors$I.addVariantDetached);
          if (isDetached) {
            this.initDetached();
          } else {
            this.initWithForm();
          }
        }
      }

      initWithForm() {
        this.button.addEventListener(
          'click',
          function (evt) {
            const outerForm = evt.target.closest('form');
            if (outerForm.querySelector('[type="file"]')) {
              return;
            }
            if (!this.reloadCart) {
              evt.preventDefault();
            }

            this.button.setAttribute('disabled', true);
            this.button.classList.add(classes$l.loading);

            const formData = new FormData(outerForm);
            const formString = new URLSearchParams(formData).toString();
            this.addToCartAction(formString);
          }.bind(this)
        );
      }

      initDetached() {
        this.button.addEventListener(
          'click',
          function (evt) {
            evt.preventDefault();

            this.button.setAttribute('disabled', true);
            this.button.classList.add(classes$l.loading);

            const variant = this.button.getAttribute(selectors$I.addVariantDetached);
            const formString = `form_type=product&id=${variant}`;

            this.addToCartAction(formString);
          }.bind(this)
        );
      }

      addToCartAction(formData) {
        const url = `${window.theme.routes.cart}/add.js`;
        const instance = this;
        axios
          .post(url, formData, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
          .then(function (response) {
            instance.onSuccess(response.data);
          })
          .catch(function (error) {
            console.warn(error);
            instance.onError(error.data);
          });
      }

      onSuccess(variant) {
        this.updateHeaderTotal();
        this.button.classList.remove(classes$l.loading);
        this.button.classList.add(classes$l.success);
        setTimeout(() => {
          this.button.classList.remove(classes$l.success);
          this.button.removeAttribute('disabled');
        }, 3500);

        if (this.reloadCart) {
          document.dispatchEvent(new CustomEvent('theme:cart:reload', {bubbles: true}));
        } else if (this.drawer) {
          this.drawer.dispatchEvent(
            new CustomEvent('theme:drawer:open', {
              detail: {
                variant: variant,
                reinit: true,
              },
              bubbles: true,
            })
          );
        }
      }

      onError(error) {
        if (error) {
          if (error.description && typeof error.description === 'string') {
            // Standard stockout error
            this.error = error.description;
          } else if (error.message && typeof error.message === 'string') {
            // Standard giftcard validation error
            this.error = error.message;
          } else if (error.description && typeof error.description === 'object') {
            // Error is custom object, print keys and values into message to avoid [Object object]
            this.error = Object.keys(error.description)
              .map((key) => {
                return `${key}: ${error.description[key]}`;
              })
              .join('<br>');
          } else {
            // Fallback
            this.error = 'Network error: please try again';
          }

          const errorsHTML = `<div class="errors">${this.error}</div>`;
          this.button.classList.remove(classes$l.loading);
          this.button.removeAttribute('disabled');
          this.errors.innerHTML = errorsHTML;

          slideDown(this.errors);
          setTimeout(() => {
            slideUp(this.errors);
          }, 5000);
        } else {
          throw error;
        }
      }

      updateHeaderTotal() {
        axios
          .get(`${window.theme.routes.cart}.js`)
          .then((response) => {
            document.dispatchEvent(
              new CustomEvent('theme:cart:change', {
                detail: {
                  cart: response.data,
                },
                bubbles: true,
              })
            );
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }

    const productAddSection = {
      onLoad() {
        sections$n[this.id] = [];
        const els = this.container.querySelectorAll(selectors$I.wrapper);
        els.forEach((el) => {
          sections$n[this.id].push(new ProductAddButton$1(el));
        });
      },
      onUnload: function () {
        sections$n[this.id].forEach((el) => {
          if (typeof el.unload === 'function') {
            el.unload();
          }
        });
      },
    };

    const selectors$H = {
      wrapper: '[data-quantity-selector]',
      increase: '[data-increase-quantity]',
      decrease: '[data-decrease-quantity]',
      input: '[data-quantity-input]',
    };

    class Quantity {
      constructor(wrapper) {
        this.wrapper = wrapper;
        this.increase = this.wrapper.querySelector(selectors$H.increase);
        this.decrease = this.wrapper.querySelector(selectors$H.decrease);
        this.input = this.wrapper.querySelector(selectors$H.input);
        this.min = parseInt(this.input.getAttribute('min'), 10);
        this.initButtons();
      }

      initButtons() {
        this.increase.addEventListener(
          'click',
          function (e) {
            e.preventDefault();
            let v = parseInt(this.input.value, 10);
            v = isNaN(v) ? 0 : v;
            v++;
            this.input.value = v;
            this.input.dispatchEvent(new Event('change'));
          }.bind(this)
        );
        this.decrease.addEventListener(
          'click',
          function (e) {
            e.preventDefault();
            let v = parseInt(this.input.value, 10);
            v = isNaN(v) ? 0 : v;
            v--;
            v = Math.max(this.min, v);
            this.input.value = v;
            this.input.dispatchEvent(new Event('change'));
          }.bind(this)
        );
      }
    }

    function initQtySection(container) {
      const quantityWrappers = container.querySelectorAll(selectors$H.wrapper);
      quantityWrappers.forEach((qty) => {
        new Quantity(qty);
      });
    }

    const selectors$G = {
      drawer: '[data-drawer="drawer-cart"]',
      shipping: '[data-shipping-estimate-form]',
      loader: '[data-cart-loading]',
      form: '[data-cart-form]',
      emptystate: '[data-cart-empty]',
      progress: '[data-cart-progress]',
      items: '[data-line-items]',
      subtotal: '[data-cart-subtotal]',
      bottom: '[data-cart-bottom]',
      quantity: '[data-quantity-selector]',
      errors: '[data-form-errors]',
      item: '[data-cart-item]',
      finalPrice: '[data-cart-final]',
      key: 'data-update-cart',
      remove: 'data-remove-key',
      upsellProduct: '[data-upsell-holder]',
      cartPage: '[data-section-type="cart"]',
      bar: '[data-cart-bar]',
      blankState: '[data-cart-blankstate]',
    };

    const classes$k = {
      hidden: 'cart--hidden',
      loading: 'cart--loading',
    };

    class CartItems {
      constructor(section) {
        this.section = section;
        this.container = section.container;
        this.bar = this.container.querySelector(selectors$G.bar);
        this.drawer = this.container.querySelector(selectors$G.drawer);
        this.form = this.container.querySelector(selectors$G.form);
        this.loader = this.container.querySelector(selectors$G.loader);
        this.bottom = this.container.querySelector(selectors$G.bottom);
        this.items = this.container.querySelector(selectors$G.items);
        this.subtotal = this.container.querySelector(selectors$G.subtotal);
        this.errors = this.container.querySelector(selectors$G.errors);
        this.finalPrice = this.container.querySelector(selectors$G.finalPrice);
        this.emptystate = this.container.querySelector(selectors$G.emptystate);
        this.progress = this.container.querySelector(selectors$G.progress);
        this.blankState = this.container.querySelector(selectors$G.blankState);
        this.latestClick = null;
        this.cart = null;
        this.stale = true;
        this.cartPage = document.querySelector(selectors$G.cartPage);
        this.listen();
      }

      listen() {
        document.addEventListener(
          'theme:cart:change',
          function (event) {
            this.cart = event.detail.cart;
            this.stale = true;
          }.bind(this)
        );

        document.addEventListener(
          'theme:cart:init',
          function () {
            this.init();
          }.bind(this)
        );

        document.addEventListener(
          'theme:cart:reload',
          function () {
            this.stale = true;
            if (this.cart) {
              this.loadHTML();
            } else {
              this.init().then(() => this.loadHTML());
            }
          }.bind(this)
        );

        if (this.drawer) {
          this.drawer.addEventListener(
            'theme:drawer:open',
            function (event) {
              const reinit = event.detail === null ? false : event.detail.reinit;

              if (this.cart && !reinit) {
                this.loadHTML();
              } else {
                this.init().then(() => this.loadHTML());
              }
            }.bind(this)
          );
        }

        new CartNotes(this.container);
        new CartShippingMessage(this.container);
      }

      init() {
        if (!this.emptystate.classList.contains(classes$k.hidden)) {
          this.emptystate.classList.add(classes$k.hidden);
          this.blankState?.classList.remove(classes$k.hidden);
        }

        return window
          .fetch(`${window.theme.routes.cart}.js`)
          .then(this.handleErrors)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            this.cart = response;
            this.fireChange(response);
            return response;
          })
          .catch((e) => {
            console.error(e);
          });
      }

      loadHTML() {
        if (this.stale) {
          if (this.cart && this.cart.item_count > 0) {
            this.loadForm();
          } else {
            this.showEmpty();
          }
        }
        this.stale = false;
      }

      initInputs() {
        this.inputs = this.container.querySelectorAll(`[${selectors$G.key}]`);
        this.inputs.forEach((input) => {
          const key = input.getAttribute(selectors$G.key);
          input.addEventListener(
            'change',
            function (e) {
              const quantity = parseInt(e.target.value, 10);
              this.latestClick = e.target.closest(selectors$G.item);
              this.lockState();
              this.updateCart(key, quantity);
            }.bind(this)
          );
        });
      }

      initRemove() {
        this.removers = this.container.querySelectorAll(`[${selectors$G.remove}]`);
        this.removers.forEach((remover) => {
          const key = remover.getAttribute(selectors$G.remove);
          remover.addEventListener(
            'click',
            function (e) {
              e.preventDefault();
              this.latestClick = e.target.closest(selectors$G.item);
              this.lockState();
              this.updateCart(key, 0);
            }.bind(this)
          );
        });
      }

      lockState() {
        this.latestClick.querySelector('.item--loadbar').style.display = 'block';
        this.loader.classList.add(classes$k.loading);
      }

      updateCart(clickedKey, newQuantity) {
        window
          .fetch(`${window.theme.routes.cart}/change.js`, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: clickedKey,
              quantity: newQuantity,
            }),
          })
          .then(this.handleErrors)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            this.cart = response;

            slideUp(this.errors);
            this.fireChange(response);
            this.stale = true;

            this.loadHTML();
          })
          .catch((e) => {
            if (e instanceof FetchError) {
              let heading = `<p>${e.json?.message || e.message || e.json?.description || e.description || window.theme.strings.stockout || 'Could not update cart, please reload'}</p>`;
              let paragraph = e.json?.description || '';
              this.showError([heading, paragraph].join(' '));
              this.loadForm(); // Reset form for cases like "stockout"
            } else {
              let error = `<p>${e.message || e.description || window.theme.strings.stockout || 'Could not update cart, please reload'}</p>`;
              this.showError(error);
              throw e;
            }
          });
      }

      fireChange(newCart) {
        document.dispatchEvent(
          new CustomEvent('theme:cart:change', {
            detail: {
              cart: newCart,
            },
            bubbles: true,
          })
        );
      }

      updateTotal() {
        if (this.cart && this.cart.total_price) {
          const price = themeCurrency.formatMoney(this.cart.total_price, theme.moneyFormat);
          this.finalPrice.innerHTML = price + ` ${theme.currencyCode}`;
        }
        if (this.subtotal && this.cart) {
          window
            .fetch(`${window.theme.routes.root_url}?section_id=api-cart-subtotal`)
            .then(this.handleErrors)
            .then((response) => {
              return response.text();
            })
            .then((response) => {
              const fresh = document.createElement('div');
              fresh.innerHTML = response;
              this.subtotal.innerHTML = fresh.querySelector('[data-api-content]').innerHTML;
            });
        }
      }

      showError(message) {
        slideUp(this.errors);
        this.errors.innerHTML = message;
        window.setTimeout(() => {
          slideDown(this.errors);
        }, 600);
      }

      stockoutError(itemTitle) {
        let heading = `<p><strong>${window.theme.strings.stockout}</strong></p>`;
        let paragraph = `<p>${itemTitle}</p>`;
        this.showError(`${heading + paragraph}`);
      }

      loadForm() {
        window
          .fetch(`${window.theme.routes.root_url}?section_id=api-cart-items`)
          .then(this.handleErrors)
          .then((response) => {
            return response.text();
          })
          .then((response) => {
            const fresh = document.createElement('div');
            fresh.innerHTML = response;
            this.items.innerHTML = fresh.querySelector('[data-api-content]').innerHTML;

            this.showForm();
            this.initQuantity();
            this.initUpsell();
            this.updateTotal();

            if (this.drawer) {
              moveModals(this.drawer);
            }
          });
      }

      initUpsell() {
        const upsellProduct = this.items.querySelector(selectors$G.upsellProduct);
        const oldUpsellProduct = this.bottom.querySelector(selectors$G.upsellProduct);
        const upsellButton = this.items.querySelector('[data-add-action-wrapper]');

        if (oldUpsellProduct) {
          oldUpsellProduct.remove();
        }

        if (this.cartPage && upsellProduct) {
          this.bottom.insertBefore(upsellProduct, this.bottom.firstChild);
        }

        if (upsellProduct && upsellButton) {
          // isCartItem tells add button to refresh the cart
          // instead of loading a popdown notification
          const isCartItem = true;

          // Has only default variant
          new ProductAddButton$1(upsellProduct, isCartItem);
        }
      }

      initQuantity() {
        initQtySection(this.container);
        this.initInputs();
        this.initRemove();
      }

      showForm() {
        if (this.bar) {
          this.bar.classList.remove(classes$k.hidden);
        }

        this.form.classList.remove(classes$k.hidden);
        this.bottom.classList.remove(classes$k.hidden);
        this.progress?.classList.remove(classes$k.hidden);
        this.loader.classList.remove(classes$k.loading);
        this.emptystate.classList.add(classes$k.hidden);
        if (this.blankState) {
          this.blankState.classList.add(classes$k.hidden);
        }
      }

      showEmpty() {
        if (this.bar) {
          this.bar.classList.add(classes$k.hidden);
        }

        this.emptystate.classList.remove(classes$k.hidden);
        this.loader.classList.remove(classes$k.loading);
        this.form.classList.add(classes$k.hidden);
        this.bottom.classList.add(classes$k.hidden);
        this.progress?.classList.add(classes$k.hidden);
        if (this.blankState) {
          this.blankState.classList.add(classes$k.hidden);
        }
      }

      handleErrors(response) {
        if (!response.ok) {
          return response.json().then(function (json) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              json: json,
            });
            throw e;
          });
        }
        return response;
      }
    }

    const cartDrawer = {
      onLoad() {
        const isDrawerCart = this.container.querySelector(selectors$G.drawer);
        if (isDrawerCart) {
          this.cart = new CartItems(this);
        }

        const hasShipping = this.container.querySelector(selectors$G.shipping);
        if (hasShipping) {
          new ShippingCalculator(this);
        }
      },
      onUnload: function () {
        if (this.cart && typeof this.cart.unload === 'function') {
          this.cart.unload();
        }
      },
    };

    const selectors$F = {
      wrapper: '[data-search-popdown-wrap]',
      popdownTrigger: 'data-popdown-toggle',
      close: '[data-close-popdown]',
      input: '[data-predictive-search-input]',
      underlay: '[data-search-underlay]',
    };

    const classes$j = {
      underlayVisible: 'underlay--visible',
      isVisible: 'is-visible',
    };

    let sections$m = {};

    class SearchPopdownTriggers {
      constructor(trigger) {
        this.trigger = trigger;
        this.key = this.trigger.getAttribute(selectors$F.popdownTrigger);

        const popdownSelector = `[id='${this.key}']`;
        this.popdown = document.querySelector(popdownSelector);
        this.input = this.popdown.querySelector(selectors$F.input);
        this.close = this.popdown.querySelector(selectors$F.close);
        this.wrapper = this.popdown.closest(selectors$F.wrapper);
        this.underlay = this.wrapper.querySelector(selectors$F.underlay);

        this.initTriggerEvents();
        this.initPopdownEvents();
      }

      initTriggerEvents() {
        this.trigger.setAttribute('aria-haspopup', true);
        this.trigger.setAttribute('aria-expanded', false);
        this.trigger.setAttribute('aria-controls', this.key);
        this.trigger.addEventListener(
          'click',
          function (evt) {
            evt.preventDefault();
            this.showPopdown();
          }.bind(this)
        );
        this.trigger.addEventListener(
          'keyup',
          function (evt) {
            if (evt.which !== window.theme.keyboardKeys.SPACE) {
              return;
            }
            this.showPopdown();
          }.bind(this)
        );
      }

      initPopdownEvents() {
        this.popdown.addEventListener(
          'keyup',
          function (evt) {
            if (evt.which !== window.theme.keyboardKeys.ESCAPE) {
              return;
            }
            this.hidePopdown();
          }.bind(this)
        );
        this.close.addEventListener(
          'click',
          function () {
            this.hidePopdown();
          }.bind(this)
        );
        this.underlay.addEventListener(
          'click',
          function () {
            this.hidePopdown();
          }.bind(this)
        );
      }

      hidePopdown() {
        this.popdown.classList.remove(classes$j.isVisible);
        this.underlay.classList.remove(classes$j.underlayVisible);
        this.trigger.focus();
        removeTrapFocus();
        this.input.dispatchEvent(new CustomEvent('clear', {bubbles: false}));
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }

      showPopdown() {
        this.popdown.classList.add(classes$j.isVisible);
        this.underlay.classList.add(classes$j.underlayVisible);
        trapFocus(this.popdown, {elementToFocus: this.input});
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
      }
    }

    const searchPopdown = {
      onLoad() {
        sections$m[this.id] = {};
        const triggers = this.container.querySelectorAll(`[${selectors$F.popdownTrigger}]`);
        triggers.forEach((trigger) => {
          sections$m[this.id] = new SearchPopdownTriggers(trigger);
        });
      },
    };

    const showElement = (elem, removeProp = false, prop = 'block') => {
      if (elem) {
        if (removeProp) {
          elem.style.removeProperty('display');
        } else {
          elem.style.display = prop;
        }
      }
    };

    const hideElement = (elem) => {
      if (elem) {
        elem.style.display = 'none';
      }
    };

    const selectors$E = {
      inputSearch: 'input[type="search"]',
      focusedElements: '[aria-selected="true"] a',
      resetButton: 'button[type="reset"]',
    };

    const classes$i = {
      hidden: 'is-hidden',
    };

    class HeaderSearchForm extends HTMLElement {
      constructor() {
        super();

        this.input = this.querySelector(selectors$E.inputSearch);
        this.resetButton = this.querySelector(selectors$E.resetButton);

        if (this.input) {
          this.input.form.addEventListener('reset', this.onFormReset.bind(this));
          this.input.addEventListener(
            'input',
            debounce$1((event) => {
              this.onChange(event);
            }, 300).bind(this)
          );
        }
      }

      toggleResetButton() {
        const resetIsHidden = this.resetButton.classList.contains(classes$i.hidden);
        if (this.input.value.length > 0 && resetIsHidden) {
          this.resetButton.classList.remove(classes$i.hidden);
        } else if (this.input.value.length === 0 && !resetIsHidden) {
          this.resetButton.classList.add(classes$i.hidden);
        }
      }

      onChange() {
        this.toggleResetButton();
      }

      shouldResetForm() {
        return !document.querySelector(selectors$E.focusedElements);
      }

      onFormReset(event) {
        // Prevent default so the form reset doesn't set the value gotten from the url on page load
        event.preventDefault();
        // Don't reset if the user has selected an element on the predictive search dropdown
        if (this.shouldResetForm()) {
          this.input.value = '';
          this.toggleResetButton();
          event.target.querySelector(selectors$E.inputSearch).focus();
        }
      }
    }

    customElements.define('header-search-form', HeaderSearchForm);

    const selectors$D = {
      allVisibleElements: '[role="option"]',
      ariaSelected: '[aria-selected="true"]',
      predictiveSearch: 'predictive-search',
      predictiveSearchResults: '[data-predictive-search-results]',
      predictiveSearchStatus: '[data-predictive-search-status]',
      searchInput: '[data-predictive-search-input]',
      searchResultsLiveRegion: '[data-predictive-search-live-region-count-value]',
      searchResultsGroupsWrapper: 'data-search-results-groups-wrapper',
      searchForText: '[data-predictive-search-search-for-text]',
      sectionPredictiveSearch: '#shopify-section-predictive-search',
      selectedLink: '[aria-selected="true"] a',
      selectedOption: '[aria-selected="true"] a, button[aria-selected="true"]',
      loader: '[data-loading-indicator]',
    };

    class PredictiveSearch extends HeaderSearchForm {
      constructor() {
        super();

        this.wrapper = this;
        this.a11y = a11y;
        this.abortController = new AbortController();
        this.allPredictiveSearchInstances = document.querySelectorAll(selectors$D.predictiveSearch);
        this.cachedResults = {};
        this.input = this.wrapper.querySelector(selectors$D.searchInput);
        this.isOpen = false;
        this.predictiveSearchResults = this.querySelector(selectors$D.predictiveSearchResults);
        this.searchTerm = '';
        this.loader = this.wrapper.querySelector(selectors$D.loader);
      }

      connectedCallback() {
        this.input.addEventListener('focus', this.onFocus.bind(this));
        this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));

        this.addEventListener('focusout', this.onFocusOut.bind(this));
        this.addEventListener('keyup', this.onKeyup.bind(this));
        this.addEventListener('keydown', this.onKeydown.bind(this));
      }

      getQuery() {
        return this.input.value.trim();
      }

      onChange() {
        super.onChange();
        const newSearchTerm = this.getQuery();

        if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
          // Remove the results when they are no longer relevant for the new search term
          // so they don't show up when the dropdown opens again
          this.querySelector(selectors$D.searchResultsGroupsWrapper)?.remove();
        }

        // Update the term asap, don't wait for the predictive search query to finish loading
        this.updateSearchForTerm(this.searchTerm, newSearchTerm);

        this.searchTerm = newSearchTerm;

        if (!this.searchTerm.length) {
          this.reset();
          return;
        }

        this.getSearchResults(this.searchTerm);
      }

      onFormSubmit(event) {
        if (!this.getQuery().length || this.querySelector(selectors$D.selectedLink)) event.preventDefault();
      }

      onFormReset(event) {
        super.onFormReset(event);
        if (super.shouldResetForm()) {
          this.searchTerm = '';
          this.abortController.abort();
          this.abortController = new AbortController();
          this.closeResults(true);
        }
      }

      shouldResetForm() {
        return !document.querySelector(selectors$D.selectedLink);
      }

      onFocus() {
        const currentSearchTerm = this.getQuery();

        if (!currentSearchTerm.length) return;

        if (this.searchTerm !== currentSearchTerm) {
          // Search term was changed from other search input, treat it as a user change
          this.onChange();
        } else if (this.getAttribute('results') === 'true') {
          this.open();
        } else {
          this.getSearchResults(this.searchTerm);
        }
      }

      onFocusOut() {
        setTimeout(() => {
          if (!this.contains(document.activeElement)) this.close();
        });
      }

      onKeyup(event) {
        if (!this.getQuery().length) this.close(true);
        event.preventDefault();

        switch (event.code) {
          case 'ArrowUp':
            this.switchOption('up');
            break;
          case 'ArrowDown':
            this.switchOption('down');
            break;
          case 'Enter':
            this.selectOption();
            break;
        }
      }

      onKeydown(event) {
        // Prevent the cursor from moving in the input when using the up and down arrow keys
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          event.preventDefault();
        }
      }

      updateSearchForTerm(previousTerm, newTerm) {
        const searchForTextElement = this.querySelector(selectors$D.searchForText);
        const currentButtonText = searchForTextElement?.innerText;

        if (currentButtonText) {
          if (currentButtonText.match(new RegExp(previousTerm, 'g'))?.length > 1) {
            // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
            return;
          }
          const newButtonText = currentButtonText.replace(previousTerm, newTerm);
          searchForTextElement.innerText = newButtonText;
        }
      }

      switchOption(direction) {
        if (!this.getAttribute('open')) return;

        const moveUp = direction === 'up';
        const selectedElement = this.querySelector(selectors$D.ariaSelected);

        // Filter out hidden elements (duplicated page and article resources) thanks
        // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
        const allVisibleElements = Array.from(this.querySelectorAll(selectors$D.allVisibleElements)).filter((element) => element.offsetParent !== null);

        let activeElementIndex = 0;

        if (moveUp && !selectedElement) return;

        let selectedElementIndex = -1;
        let i = 0;

        while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
          if (allVisibleElements[i] === selectedElement) {
            selectedElementIndex = i;
          }
          i++;
        }

        this.statusElement.textContent = '';

        if (!moveUp && selectedElement) {
          activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
        } else if (moveUp) {
          activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
        }

        if (activeElementIndex === selectedElementIndex) return;

        const activeElement = allVisibleElements[activeElementIndex];

        activeElement.setAttribute('aria-selected', true);
        if (selectedElement) selectedElement.setAttribute('aria-selected', false);

        this.input.setAttribute('aria-activedescendant', activeElement.id);
      }

      selectOption() {
        const selectedOption = this.querySelector(selectors$D.selectedOption);

        if (selectedOption) selectedOption.click();
      }

      getSearchResults(searchTerm) {
        const queryKey = searchTerm.replace(' ', '-').toLowerCase();
        this.setLiveRegionLoadingState();

        if (this.cachedResults[queryKey]) {
          this.renderSearchResults(this.cachedResults[queryKey]);
          return;
        }

        showElement(this.loader);

        fetch(`${theme.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`, {signal: this.abortController.signal})
          .then(this.handleErrors)
          .then((response) => response.text())
          .then((response) => {
            const resultsMarkup = new DOMParser().parseFromString(response, 'text/html').querySelector(selectors$D.sectionPredictiveSearch).innerHTML;
            // Save bandwidth keeping the cache in all instances synced
            this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
              predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
            });
            this.renderSearchResults(resultsMarkup);
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            hideElement(this.loader);
          });
      }

      setLiveRegionLoadingState() {
        this.statusElement = this.statusElement || this.querySelector(selectors$D.predictiveSearchStatus);
        this.loadingText = this.loadingText || this.getAttribute('data-loading-text');

        this.setLiveRegionText(this.loadingText);
        this.setAttribute('loading', true);
      }

      setLiveRegionText(statusText) {
        this.statusElement.setAttribute('aria-hidden', 'false');
        this.statusElement.textContent = statusText;

        setTimeout(() => {
          this.statusElement.setAttribute('aria-hidden', 'true');
        }, 1000);
      }

      renderSearchResults(resultsMarkup) {
        this.predictiveSearchResults.innerHTML = resultsMarkup;

        this.setAttribute('results', true);

        this.setLiveRegionResults();
        this.open();
      }

      setLiveRegionResults() {
        this.removeAttribute('loading');
        this.setLiveRegionText(this.querySelector(selectors$D.searchResultsLiveRegion).textContent);
      }

      open() {
        this.setAttribute('open', true);
        this.input.setAttribute('aria-expanded', true);
        this.isOpen = true;

        this.setViewportHeight();

        // Re-calculate viewport height on iOS devices after the virtual keyboard shows up
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          setTimeout(() => {
            this.setViewportHeight();
          }, 500);
        }
      }

      close(clearSearchTerm = false) {
        this.closeResults(clearSearchTerm);
        this.isOpen = false;
      }

      closeResults(clearSearchTerm = false) {
        if (clearSearchTerm) {
          this.input.value = '';
          this.removeAttribute('results');
        }
        const selected = this.querySelector(selectors$D.ariaSelected);

        if (selected) selected.setAttribute('aria-selected', false);

        this.input.setAttribute('aria-activedescendant', '');
        this.removeAttribute('loading');
        this.removeAttribute('open');
        this.input.setAttribute('aria-expanded', false);
        this.predictiveSearchResults?.removeAttribute('style');
      }

      reset() {
        this.predictiveSearchResults.innerHTML = '';

        this.input.val = '';
        this.a11y.removeTrapFocus();
      }

      handleErrors(response) {
        if (!response.ok) {
          return response.json().then(function (json) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              json: json,
            });
            throw e;
          });
        }
        return response;
      }

      setViewportHeight() {
        const windowHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        this.style.setProperty('--full-screen', `${windowHeight}px`);
      }
    }

    function getWindowWidth() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    }

    function isDesktop() {
      return getWindowWidth() >= window.theme.sizes.small;
    }

    const selectors$C = {
      inputSearch: 'input[type="search"]',
    };

    class MainSearch extends HeaderSearchForm {
      constructor() {
        super();

        this.allSearchInputs = document.querySelectorAll(selectors$C.inputSearch);
        this.setupEventListeners();
      }

      setupEventListeners() {
        let allSearchForms = [];
        this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
        this.input.addEventListener('focus', this.onInputFocus.bind(this));
        if (allSearchForms.length < 2) return;
        allSearchForms.forEach((form) => form.addEventListener('reset', this.onFormReset.bind(this)));
        this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
      }

      onFormReset(event) {
        super.onFormReset(event);
        if (super.shouldResetForm()) {
          this.keepInSync('', this.input);
        }
      }

      onInput(event) {
        const target = event.target;
        this.keepInSync(target.value, target);
      }

      onInputFocus() {
        if (!isDesktop()) {
          this.scrollIntoView({behavior: 'smooth'});
        }
      }

      keepInSync(value, target) {
        this.allSearchInputs.forEach((input) => {
          if (input !== target) {
            input.value = value;
          }
        });
      }
    }

    const selectors$B = {
      popoutWrapper: '[data-popout]',
      popoutList: '[data-popout-list]',
      popoutToggle: 'data-popout-toggle',
      popoutInput: '[data-popout-input]',
      popoutOptions: '[data-popout-option]',
      popoutPrevent: 'data-popout-prevent',
      popoutQuantity: 'data-quantity-field',
      dataValue: 'data-value',
      ariaExpanded: 'aria-expanded',
      ariaCurrent: 'aria-current',
    };

    const classes$h = {
      listVisible: 'popout-list--visible',
      currentSuffix: '--current',
    };

    class PopoutSelect extends HTMLElement {
      constructor() {
        super();

        this.container = this.querySelector(selectors$B.popoutWrapper);
        this.popoutList = this.container.querySelector(selectors$B.popoutList);
        this.popoutToggle = this.container.querySelector(`[${selectors$B.popoutToggle}]`);
        this.outsidePopupToggle = document.querySelector(`[${selectors$B.popoutToggle}="${this.popoutList.id}"]`);
        this.popoutInput = this.container.querySelector(selectors$B.popoutInput);
        this.popoutOptions = this.container.querySelectorAll(selectors$B.popoutOptions);
        this.popoutPrevent = this.container.getAttribute(selectors$B.popoutPrevent) === 'true';

        this._connectOptions();
        this._connectToggle();
        this._onFocusOut();

        if (this.popoutInput && this.popoutInput.hasAttribute(selectors$B.popoutQuantity)) {
          document.addEventListener('popout:updateValue', this.updatePopout.bind(this));
        }
      }

      unload() {
        if (this.popoutOptions.length) {
          this.popoutOptions.forEach((element) => {
            element.removeEventListener('clickDetails', this.popupOptionsClick.bind(this));
            element.removeEventListener('click', this._connectOptionsDispatch.bind(this));
          });
        }

        this.popoutToggle.removeEventListener('click', this.popupToggleClick.bind(this));

        this.popoutToggle.removeEventListener('focusout', this.popupToggleFocusout.bind(this));

        this.popoutList.removeEventListener('focusout', this.popupListFocusout.bind(this));

        this.container.removeEventListener('keyup', this.containerKeyup.bind(this));

        if (this.outsidePopupToggle) {
          this.outsidePopupToggle.removeEventListener('click', this.popupToggleClick.bind(this));

          this.outsidePopupToggle.removeEventListener('focusout', this.popupToggleFocusout.bind(this));
        }
      }

      popupToggleClick(evt) {
        const ariaExpanded = evt.currentTarget.getAttribute(selectors$B.ariaExpanded) === 'true';
        evt.currentTarget.setAttribute(selectors$B.ariaExpanded, !ariaExpanded);
        this.popoutList.classList.toggle(classes$h.listVisible);
      }

      popupToggleFocusout(evt) {
        const popoutLostFocus = this.container.contains(evt.relatedTarget);

        if (!popoutLostFocus) {
          this._hideList();
        }
      }

      popupListFocusout(evt) {
        const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
        const isVisible = this.popoutList.classList.contains(classes$h.listVisible);

        if (isVisible && !childInFocus) {
          this._hideList();
        }
      }

      popupOptionsClick(evt) {
        const link = evt.target.closest(selectors$B.popoutOptions);
        if (link.attributes.href.value === '#') {
          evt.preventDefault();

          let attrValue = '';

          if (evt.currentTarget.getAttribute(selectors$B.dataValue)) {
            attrValue = evt.currentTarget.getAttribute(selectors$B.dataValue);
          }

          this.popoutInput.value = attrValue;

          if (this.popoutPrevent) {
            this.popoutInput.dispatchEvent(new Event('change'));

            if (!evt.detail.preventTrigger && this.popoutInput.hasAttribute(selectors$B.popoutQuantity)) {
              this.popoutInput.dispatchEvent(new Event('input'));
            }

            const currentElement = this.popoutList.querySelector(`[class*="${classes$h.currentSuffix}"]`);
            let targetClass = classes$h.currentSuffix;

            if (currentElement && currentElement.classList.length) {
              for (const currentElementClass of currentElement.classList) {
                if (currentElementClass.includes(classes$h.currentSuffix)) {
                  targetClass = currentElementClass;
                  break;
                }
              }
            }

            const listTargetElement = this.popoutList.querySelector(`.${targetClass}`);

            if (listTargetElement) {
              listTargetElement.classList.remove(`${targetClass}`);
              evt.currentTarget.parentElement.classList.add(`${targetClass}`);
            }

            const targetAttribute = this.popoutList.querySelector(`[${selectors$B.ariaCurrent}]`);

            if (targetAttribute && targetAttribute.hasAttribute(`${selectors$B.ariaCurrent}`)) {
              targetAttribute.removeAttribute(`${selectors$B.ariaCurrent}`);
              evt.currentTarget.setAttribute(`${selectors$B.ariaCurrent}`, 'true');
            }

            if (attrValue !== '') {
              this.popoutToggle.textContent = attrValue;

              if (this.outsidePopupToggle) {
                this.outsidePopupToggle.textContent = attrValue;
              }
            }

            this.popupToggleFocusout(evt);
            this.popupListFocusout(evt);
          } else {
            this._submitForm(attrValue);
          }
        }
      }

      updatePopout(evt) {
        const targetElement = this.popoutList.querySelector(`[${selectors$B.dataValue}="${this.popoutInput.value}"]`);
        if (targetElement) {
          targetElement.dispatchEvent(
            new CustomEvent('clickDetails', {
              cancelable: true,
              bubbles: true,
              detail: {
                preventTrigger: true,
              },
            })
          );
        }
      }

      containerKeyup(evt) {
        if (evt.which !== window.theme.keyboardKeys.ESCAPE) {
          return;
        }
        this._hideList();
        this.popoutToggle.focus();
      }

      bodyClick(evt) {
        const isOption = this.container.contains(evt.target);
        const isVisible = this.popoutList.classList.contains(classes$h.listVisible);
        const isOutside = this.outsidePopupToggle === evt.target;

        if (isVisible && !isOption && !isOutside) {
          this._hideList();
        }
      }

      _connectToggle() {
        this.popoutToggle.addEventListener('click', this.popupToggleClick.bind(this));

        if (this.outsidePopupToggle) {
          this.outsidePopupToggle.addEventListener('click', this.popupToggleClick.bind(this));
        }
      }

      _connectOptions() {
        if (this.popoutOptions.length) {
          this.popoutOptions.forEach((element) => {
            element.addEventListener('clickDetails', this.popupOptionsClick.bind(this));
            element.addEventListener('click', this._connectOptionsDispatch.bind(this));
          });
        }
      }

      _connectOptionsDispatch(evt) {
        const event = new CustomEvent('clickDetails', {
          cancelable: true,
          bubbles: true,
          detail: {
            preventTrigger: false,
          },
        });

        if (!evt.target.dispatchEvent(event)) {
          evt.preventDefault();
        }
      }

      _onFocusOut() {
        this.popoutToggle.addEventListener('focusout', this.popupToggleFocusout.bind(this));

        if (this.outsidePopupToggle) {
          this.outsidePopupToggle.addEventListener('focusout', this.popupToggleFocusout.bind(this));
        }

        this.popoutList.addEventListener('focusout', this.popupListFocusout.bind(this));

        this.container.addEventListener('keyup', this.containerKeyup.bind(this));

        document.body.addEventListener('click', this.bodyClick.bind(this));
      }

      _submitForm(value) {
        const form = this.container.closest('form');
        if (form) {
          form.submit();
        }
      }

      _hideList() {
        this.popoutList.classList.remove(classes$h.listVisible);
        this.popoutToggle.setAttribute(selectors$B.ariaExpanded, false);
        if (this.outsidePopupToggle) {
          this.outsidePopupToggle.setAttribute(selectors$B.ariaExpanded, false);
        }
      }
    }

    const selectors$A = {
      frame: '[data-header-mobile] [data-ticker-frame]',
      scale: '[data-ticker-scale]',
      text: '[data-ticker-text]',
      spaceWrapper: '[data-takes-space-wrapper]',
      clone: 'data-clone',
      header: '[data-header-wrapper]',
    };

    const classes$g = {
      isMobileView: 'js__show__mobile',
      animationClass: 'ticker--animated',
    };

    const variables$1 = {
      moveTime: 1.63, // 100px going to move for 1.63s
      space: 100, // 100px
    };

    const sections$l = {};

    class Ticker {
      constructor(el) {
        this.frame = el;
        this.scale = this.frame.querySelector(selectors$A.scale);
        this.text = this.frame.querySelector(selectors$A.text);
        this.spaceWrapper = this.frame.parentNode;
        this.header = document.querySelector(selectors$A.header);

        this.resizeEvent = debounce$1(() => this.checkWidth(), 100);

        this.listen();
      }

      unload() {
        document.removeEventListener('theme:resize', this.resizeEvent);
      }

      listen() {
        document.addEventListener('theme:resize', this.resizeEvent);
        this.checkWidth();
      }

      checkWidth() {
        const padding = window.getComputedStyle(this.spaceWrapper).paddingLeft.replace('px', '') * 2;
        const clone = this.scale.querySelector(`[${selectors$A.clone}]`);

        if ((this.header.classList.contains(classes$g.isMobileView) || window.innerWidth < window.theme.sizes.small) && this.spaceWrapper.clientWidth - padding < this.text.clientWidth) {
          if (clone) {
            return;
          }

          this.scale.classList.add(classes$g.animationClass);

          this.clone = this.text.cloneNode(true);
          this.clone.setAttribute(selectors$A.clone, '');
          this.scale.appendChild(this.clone);

          const animationTimeFrame = (this.text.clientWidth / variables$1.space) * variables$1.moveTime;

          this.scale.style.setProperty('--animation-time', `${animationTimeFrame}s`);
        } else {
          const clone = this.scale.querySelector(`[${selectors$A.clone}]`);
          if (clone) {
            this.scale.removeChild(clone);
          }
          this.scale.classList.remove(classes$g.animationClass);
        }
      }
    }

    const ticker = {
      onLoad() {
        sections$l[this.id] = [];
        const el = this.container.querySelectorAll(selectors$A.frame);
        el.forEach((el) => {
          sections$l[this.id].push(new Ticker(el));
        });
      },
      onUnload() {
        sections$l[this.id].forEach((el) => {
          if (typeof el.unload === 'function') {
            el.unload();
          }
        });
      },
    };

    const selectors$z = {
      slideruleOpen: 'data-sliderule-open',
      slideruleClose: 'data-sliderule-close',
      sliderulePane: 'data-sliderule-pane',
      slideruleWrappper: '[data-sliderule]',
      dataAnimates: 'data-animates',
      focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      children: `:scope > [data-animates],
             :scope > * > [data-animates],
             :scope > * > * > [data-animates],
             :scope > * > * > * > [data-animates],
             :scope > * > * > * > * > [data-animates],
             :scope > * > .sliderule-grid  > *`,
    };

    const classes$f = {
      isVisible: 'is-visible',
      isHiding: 'is-hiding',
      isHidden: 'is-hidden',
    };

    let sections$k = {};

    class HeaderMobileSliderule {
      constructor(el) {
        this.sliderule = el;
        this.wrapper = el.closest(selectors$z.wrapper);
        this.key = this.sliderule.id;
        const btnSelector = `[${selectors$z.slideruleOpen}='${this.key}']`;
        const exitSelector = `[${selectors$z.slideruleClose}='${this.key}']`;
        this.trigger = document.querySelector(btnSelector);
        this.exit = document.querySelectorAll(exitSelector);
        this.pane = document.querySelector(`[${selectors$z.sliderulePane}]`);
        this.children = this.sliderule.querySelectorAll(selectors$z.children);

        this.trigger.setAttribute('aria-haspopup', true);
        this.trigger.setAttribute('aria-expanded', false);
        this.trigger.setAttribute('aria-controls', this.key);

        this.clickEvents();
        this.staggerChildAnimations();

        document.addEventListener('theme:sliderule:close', this.closeSliderule.bind(this));
      }

      clickEvents() {
        this.trigger.addEventListener(
          'click',
          function () {
            this.showSliderule();
          }.bind(this)
        );
        this.exit.forEach((element) => {
          element.addEventListener(
            'click',
            function () {
              this.hideSliderule();
            }.bind(this)
          );
        });
      }

      keyboardEvents() {
        this.trigger.addEventListener(
          'keyup',
          function (evt) {
            if (evt.which !== window.theme.keyboardKeys.SPACE) {
              return;
            }
            this.showSliderule();
          }.bind(this)
        );
        this.sliderule.addEventListener(
          'keyup',
          function (evt) {
            if (evt.which !== window.theme.keyboardKeys.ESCAPE) {
              return;
            }
            this.hideSliderule();
            this.buttons[0].focus();
          }.bind(this)
        );
      }

      staggerChildAnimations(reverse = false) {
        const childrenArr = reverse ? Array.prototype.slice.call(this.children).slice().reverse() : this.children;

        childrenArr.forEach((child, index) => {
          child.style.transitionDelay = `${index * 50 + 10}ms`;
        });
      }

      scrollSliderule() {
        const scrollableElements = document.querySelectorAll(`[${selectors$z.sliderulePane}], ${selectors$z.slideruleWrappper}.is-visible`);
        if (scrollableElements.length) {
          scrollableElements.forEach((element) => {
            if (element.scrollTop > 0) {
              element.scrollTop = 0;
            }
          });
        }
      }

      hideSliderule(close = false) {
        this.scrollSliderule();
        const paneStyle = window.getComputedStyle(this.pane);
        const paneTransitionDuration = parseFloat(paneStyle.getPropertyValue('transition-duration')) * 1000;
        const children = close ? this.pane.querySelectorAll(`.${classes$f.isVisible}`) : this.children;
        this.pane.style.setProperty('--sliderule-height', 'auto');
        this.staggerChildAnimations(true);
        this.pane.classList.add(classes$f.isHiding);
        this.sliderule.classList.add(classes$f.isHiding);
        this.sliderule.classList.remove(classes$f.isVisible);
        children.forEach((el) => {
          el.classList.remove(classes$f.isVisible);
        });
        const newPosition = parseInt(this.pane.dataset.sliderulePane, 10) - 1;
        this.pane.setAttribute(selectors$z.sliderulePane, newPosition);

        const hidedSelector = close ? `[${selectors$z.dataAnimates}].${classes$f.isHidden}` : `[${selectors$z.dataAnimates}="${newPosition}"].${classes$f.isHidden}`;
        const hidedItems = this.pane.querySelectorAll(hidedSelector);
        if (hidedItems.length) {
          hidedItems.forEach((element) => {
            element.classList.remove(classes$f.isHidden);
          });
        }

        setTimeout(() => {
          this.pane.classList.remove(classes$f.isHiding);
          this.sliderule.classList.remove(classes$f.isHiding);
          this.staggerChildAnimations();
        }, paneTransitionDuration);

        const newHeight = parseInt(this.trigger.parentElement.parentElement.offsetHeight);
        this.pane.style.setProperty('--sliderule-height', `${newHeight}px`);
      }

      showSliderule() {
        this.scrollSliderule();
        this.pane.style.setProperty('--sliderule-height', 'auto');
        this.sliderule.classList.add(classes$f.isVisible);
        this.children.forEach((el) => {
          el.classList.add(classes$f.isVisible);
        });
        const oldPosition = parseInt(this.pane.dataset.sliderulePane, 10);
        const newPosition = oldPosition + 1;
        this.pane.setAttribute(selectors$z.sliderulePane, newPosition);
        const hidedItems = this.pane.querySelectorAll(`[${selectors$z.dataAnimates}="${oldPosition}"]`);
        if (hidedItems.length) {
          const hidedItemsTransition = parseFloat(window.getComputedStyle(hidedItems[0]).getPropertyValue('transition-duration')) * 1000;
          setTimeout(() => {
            hidedItems.forEach((element) => {
              element.classList.add(classes$f.isHidden);
            });
          }, hidedItemsTransition);
        }

        const newHeight = parseInt(this.trigger.nextElementSibling.offsetHeight);
        this.pane.style.setProperty('--sliderule-height', `${newHeight}px`);
      }

      closeSliderule() {
        if (this.pane && this.pane.hasAttribute(selectors$z.sliderulePane) && parseInt(this.pane.getAttribute(selectors$z.sliderulePane)) > 0) {
          this.hideSliderule(true);
          if (parseInt(this.pane.getAttribute(selectors$z.sliderulePane)) > 0) {
            this.pane.setAttribute(selectors$z.sliderulePane, 0);
          }
        }
      }
    }

    const headerMobileSliderule = {
      onLoad() {
        sections$k[this.id] = [];
        const els = this.container.querySelectorAll(selectors$z.slideruleWrappper);
        els.forEach((el) => {
          sections$k[this.id].push(new HeaderMobileSliderule(el));
        });
      },
    };

    const selectors$y = {
      accordionGroup: '[data-accordion-group]',
      accordionToggle: 'data-accordion-trigger',
      accordionBody: '[data-accordion-body]',
      accordionBodyMobile: 'data-accordion-body-mobile',
      accordionImage: 'data-accordion-image',
      rangeSlider: 'data-range-holder',
      section: '[data-section-id]',
    };

    const classes$e = {
      open: 'accordion-is-open',
      expanded: 'is-expanded',
      isTransitioning: 'is-transitioning',
    };

    let sections$j = {};

    class Accordion {
      constructor(el) {
        this.body = el;
        this.key = this.body.id;
        const btnSelector = `[${selectors$y.accordionToggle}='${this.key}']`;
        this.trigger = document.querySelector(btnSelector);
        this.section = this.body.closest(selectors$y.section);

        this.toggleEvent = (e) => this.clickEvents(e);
        this.keyboardEvent = (e) => this.keyboardEvents(e);
        this.hideEvent = () => this.hideEvents();

        this.syncBodies = this.getSiblings();

        if (this.body.hasAttribute(selectors$y.accordionBodyMobile)) {
          this.mobileAccordions();
        } else {
          this.init();
        }
      }

      mobileAccordions() {
        if (window.innerWidth < window.theme.sizes.medium) {
          this.init();
          this.setDefaultState();
        } else {
          this.resetMobileAccordions();
          this.body.removeAttribute('style');
        }

        document.addEventListener('theme:resize', () => {
          if (window.innerWidth < window.theme.sizes.medium) {
            this.init();
            this.setDefaultState();
          } else {
            this.resetMobileAccordions();
            this.body.removeAttribute('style');
          }
        });
      }

      init() {
        this.trigger.setAttribute('aria-haspopup', true);
        this.trigger.setAttribute('aria-expanded', false);
        this.trigger.setAttribute('aria-controls', this.key);

        this.setDefaultState();

        this.trigger.addEventListener('click', this.toggleEvent);
        this.body.addEventListener('keyup', this.keyboardEvent);
        this.body.addEventListener('theme:accordion:close', this.hideEvent);
      }

      hideEvents() {
        this.hideAccordion();
      }

      clickEvents(e) {
        e.preventDefault();
        this.toggleState();
      }

      keyboardEvents(e) {
        if (e.which !== window.theme.keyboardKeys.ESCAPE) {
          return;
        }
        this.hideAccordion();
        this.trigger.focus();
      }

      resetMobileAccordions() {
        this.trigger.removeEventListener('click', this.toggleEvent);
        this.body.removeEventListener('keyup', this.keyboardEvent);
        this.body.removeEventListener('theme:accordion:close', this.hideEvent);
      }

      setDefaultState() {
        if (this.trigger.classList.contains(classes$e.open)) {
          showElement(this.body);
        } else {
          this.hideAccordion();
        }
      }

      getSiblings() {
        const groupsArray = [...this.section.querySelectorAll(selectors$y.accordionGroup)];
        const syncWrapper = groupsArray.filter((el) => el.contains(this.body)).shift();
        if (syncWrapper) {
          const allChilden = [...syncWrapper.querySelectorAll(selectors$y.accordionBody)];
          const onlySiblings = allChilden.filter((el) => !el.contains(this.body));
          return onlySiblings;
        } else return [];
      }

      closeSiblings() {
        this.syncBodies.forEach((accordionBody) => {
          accordionBody.dispatchEvent(new CustomEvent('theme:accordion:close', {bubbles: false}));
        });
      }

      toggleState() {
        const accordionBody = this.trigger.parentElement.querySelector(selectors$y.accordionBody);
        if (accordionBody.classList.contains(classes$e.isTransitioning)) return;

        if (this.trigger.classList.contains(classes$e.open)) {
          this.hideAccordion();
        } else {
          this.showAccordion();
          this.closeSiblings();

          // Collection filters
          // Accordion with range slider custom event to reload
          if (this.body.hasAttribute(selectors$y.rangeSlider)) {
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('theme:reset-price-range', {bubbles: false}));
            }, 400);
          }
        }

        this.body.dispatchEvent(
          new CustomEvent('theme:form:sticky', {
            bubbles: true,
            detail: {
              element: 'accordion',
            },
          })
        );
      }

      hideAccordion() {
        this.trigger.classList.remove(classes$e.open);
        slideUp(this.body);
      }

      showAccordion() {
        this.trigger.classList.add(classes$e.open);
        slideDown(this.body);
        this.showAccordionImage();
      }

      showAccordionImage() {
        const target = this.section.querySelector(`[${selectors$y.accordionImage}="${this.key}"]`) || this.section.querySelector(`[${selectors$y.accordionImage}=""]`);
        if (target && this.section) {
          this.section.querySelector(`[${selectors$y.accordionImage}].${classes$e.expanded}`)?.classList.remove(classes$e.expanded);
          target.classList.add(classes$e.expanded);
        }
      }

      onBlockSelect(evt) {
        if (this.body.contains(evt.target)) {
          this.showAccordion();
        }
      }

      onBlockDeselect(evt) {
        if (this.body.contains(evt.target)) {
          this.hideAccordion();
        }
      }
    }

    const accordion = {
      onLoad() {
        sections$j[this.id] = [];
        const els = this.container.querySelectorAll(selectors$y.accordionBody);
        els.forEach((el) => {
          sections$j[this.id].push(new Accordion(el));
        });
      },
      onUnload: function () {
        sections$j[this.id].forEach((el) => {
          if (typeof el.unload === 'function') {
            el.unload();
          }
        });
      },
      onSelect: function () {
        if (this.type === 'accordion-single') {
          this.container.querySelector(`[${selectors$y.accordionToggle}]`).click();
        }
      },
      onDeselect: function () {
        if (this.type === 'accordion-single') {
          this.container.querySelector(`[${selectors$y.accordionToggle}]`).click();
        }
      },
      onBlockSelect(evt) {
        sections$j[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(evt);
          }
        });
      },
      onBlockDeselect(evt) {
        sections$j[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockDeselect(evt);
          }
        });
      },
    };

    const selectors$x = {
      wrapper: '[data-header-wrapper]',
      html: 'html',
      style: 'data-header-style',
      widthContentWrapper: '[data-takes-space-wrapper]',
      widthContent: '[data-child-takes-space]',
      desktop: '[data-header-desktop]',
      cloneClass: 'js__header__clone',
      showMobileClass: 'js__show__mobile',
      backfill: '[data-header-backfill]',
      transparent: 'data-header-transparent',
      overrideBorder: 'header-override-border',
      firstSectionHasImage: '.main-content > .shopify-section:first-child [data-overlay-header]',
      preventTransparentHeader: '.main-content > .shopify-section:first-child [data-prevent-transparent-header]',
      deadLink: '.navlink[href="#"]',
    };

    let sections$i = {};

    class Header {
      constructor(el) {
        this.wrapper = el;
        this.html = document.querySelector(selectors$x.html);
        this.style = this.wrapper.dataset.style;
        this.desktop = this.wrapper.querySelector(selectors$x.desktop);
        this.isTransparentHeader = this.wrapper.getAttribute(selectors$x.transparent) !== 'false';
        this.overlayedImages = document.querySelectorAll(selectors$x.firstSectionHasImage);
        this.deadLinks = document.querySelectorAll(selectors$x.deadLink);
        this.resizeEventWidth = () => this.checkWidth();
        this.resizeEventOverlay = () => this.subtractAnnouncementHeight();

        this.killDeadLinks();
        if (this.style !== 'drawer' && this.desktop) {
          this.minWidth = this.getMinWidth();
          this.listenWidth();
        }
        this.checkForImage();

        document.addEventListener('theme:header:check', this.checkForImage.bind(this));
        this.html.style.setProperty('--scrollbar-width', `${window.innerWidth - this.html.clientWidth}px`);
      }

      unload() {
        document.removeEventListener('theme:resize:width', this.resizeEventWidth);
        document.removeEventListener('theme:resize:width', this.resizeEventOverlay);
      }

      checkForImage() {
        // check again for overlayed images
        this.overlayedImages = document.querySelectorAll(selectors$x.firstSectionHasImage);
        let preventTransparentHeader = document.querySelectorAll(selectors$x.preventTransparentHeader).length;

        if (this.overlayedImages.length && !preventTransparentHeader && this.isTransparentHeader) {
          // is transparent and has image, overlay the image
          this.listenOverlay();
          this.wrapper.setAttribute(selectors$x.transparent, true);
          document.querySelector(selectors$x.backfill).style.display = 'none';
          theme.transparentHeader = true;
        } else {
          this.wrapper.setAttribute(selectors$x.transparent, false);
          document.querySelector(selectors$x.backfill).style.display = 'block';
          theme.transparentHeader = false;
        }

        if (this.overlayedImages.length && !preventTransparentHeader && !this.isTransparentHeader) {
          // Have image but not transparent, remove border bottom
          this.wrapper.classList.add(selectors$x.overrideBorder);
          this.subtractHeaderHeight();
        }
      }

      listenOverlay() {
        document.addEventListener('theme:resize:width', this.resizeEventOverlay);
        this.subtractAnnouncementHeight();
      }

      listenWidth() {
        document.addEventListener('theme:resize:width', this.resizeEventWidth);
        this.checkWidth();
      }

      killDeadLinks() {
        this.deadLinks.forEach((el) => {
          el.onclick = (e) => {
            e.preventDefault();
          };
        });
      }

      subtractAnnouncementHeight() {
        const {windowHeight, announcementHeight, headerHeight} = readHeights();
        this.overlayedImages.forEach((el) => {
          el.style.setProperty('--full-screen', `${windowHeight - announcementHeight}px`);
          el.style.setProperty('--header-padding', `${headerHeight}px`);
          el.classList.add('has-overlay');
        });
      }

      subtractHeaderHeight() {
        const {windowHeight, headerHeight} = readHeights();
        this.overlayedImages.forEach((el) => {
          el.style.setProperty('--full-screen', `${windowHeight - headerHeight}px`);
        });
      }

      checkWidth() {
        if (document.body.clientWidth < this.minWidth || document.body.clientWidth < window.theme.sizes.medium) {
          this.wrapper.classList.add(selectors$x.showMobileClass);
        } else {
          this.wrapper.classList.remove(selectors$x.showMobileClass);
        }
      }

      getMinWidth() {
        const comparitor = this.wrapper.cloneNode(true);
        comparitor.classList.add(selectors$x.cloneClass);
        document.body.appendChild(comparitor);
        const widthWrappers = comparitor.querySelectorAll(selectors$x.widthContentWrapper);
        let minWidth = 0;
        let spaced = 0;

        widthWrappers.forEach((context) => {
          const wideElements = context.querySelectorAll(selectors$x.widthContent);
          let thisWidth = 0;
          if (wideElements.length === 3) {
            thisWidth = _sumSplitWidths(wideElements);
          } else {
            thisWidth = _sumWidths(wideElements);
          }
          if (thisWidth > minWidth) {
            minWidth = thisWidth;
            spaced = wideElements.length * 20;
          }
        });

        document.body.removeChild(comparitor);
        return minWidth + spaced;
      }
    }

    function _sumSplitWidths(nodes) {
      let arr = [];
      nodes.forEach((el) => {
        if (el.firstElementChild) {
          arr.push(el.firstElementChild.clientWidth);
        }
      });
      if (arr[0] > arr[2]) {
        arr[2] = arr[0];
      } else {
        arr[0] = arr[2];
      }
      const width = arr.reduce((a, b) => a + b);
      return width;
    }
    function _sumWidths(nodes) {
      let width = 0;
      nodes.forEach((el) => {
        width += el.clientWidth;
      });
      return width;
    }

    const header = {
      onLoad() {
        sections$i = new Header(this.container);

        setVarsOnResize();
      },
      onUnload() {
        if (typeof sections$i.unload === 'function') {
          sections$i.unload();
        }
      },
    };

    register('header', [header, drawer, headerMobileSliderule, cartDrawer, stickyHeader, hoverDisclosure, headerTotals, searchPopdown, accordion, ticker]);

    if (!customElements.get('popout-select')) {
      customElements.define('popout-select', PopoutSelect);
    }

    if (!customElements.get('predictive-search')) {
      customElements.define('predictive-search', PredictiveSearch);
    }

    if (!customElements.get('main-search')) {
      customElements.define('main-search', MainSearch);
    }

    register('accordion', accordion);

    const selectors$w = {
      sort: '[data-sort-enabled]',
      sortLinks: '[data-sort-link]',
      sortValue: 'data-value',
    };

    let sections$h = {};

    class Sort {
      constructor(section) {
        this.container = section.container;
        this.sort = this.container.querySelector(selectors$w.sort);
        this.sortLinks = this.container.querySelectorAll(selectors$w.sortLinks);
        this.init();
      }

      init() {
        if (this.sort) {
          this.initClick();
        }
      }

      onClick(e) {
        e.preventDefault();
        const sort = e.currentTarget.getAttribute(selectors$w.sortValue);
        const url = new window.URL(window.location.href);
        const params = url.searchParams;
        params.set('sort_by', sort);
        url.search = params.toString();
        window.location.replace(url.toString());
      }

      initClick() {
        if (this.sortLinks.length) {
          this.sortLinks.forEach((link) => {
            link.addEventListener('click', (e) => this.onClick(e));
          });
        }
      }
    }

    const sort = {
      onLoad() {
        sections$h[this.id] = new Sort(this);
      },
    };

    const throttle$1 = (fn, wait) => {
      let prev, next;
      return function invokeFn(...args) {
        const now = Date.now();
        next = clearTimeout(next);
        if (!prev || now - prev >= wait) {
          // eslint-disable-next-line prefer-spread
          fn.apply(null, args);
          prev = now;
        } else {
          next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
        }
      };
    };

    const selectors$v = {
      filtersWrappper: 'data-filters',
      form: 'data-sidebar-filter-form',
      filtersHideDesktop: 'data-default-hide',
      filtersToggle: 'data-filters-toggle',
      focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      groupHeading: 'data-group-heading',
      showMore: 'data-show-more',
    };

    const classes$d = {
      show: 'drawer--visible',
      defaultVisible: 'filters--default-visible',
      hide: 'hidden',
      expand: 'is-expanded',
      hidden: 'is-hidden',
    };

    const sections$g = {};

    class Filters {
      constructor(filters) {
        this.container = filters;
        this.groupHeadings = this.container.querySelectorAll(`[${selectors$v.groupHeading}]`);
        this.showMoreButtons = this.container.querySelectorAll(`[${selectors$v.showMore}]`);
        this.form = this.container.querySelector(`[${selectors$v.form}]`);

        const triggerKey = this.form.getAttribute(selectors$v.form);
        const selector = `[${selectors$v.filtersToggle}='${triggerKey}']`;
        this.filtersToggleButtons = document.querySelectorAll(selector);

        this.connectToggleMemory = (evt) => this.connectToggleFunction(evt);
        this.connectShowHiddenOptions = (evt) => this.showHiddenOptions(evt);

        this.connectToggle();
        this.expandingEvents();
      }

      unload() {
        if (this.filtersToggleButtons.length) {
          this.filtersToggleButtons.forEach((element) => {
            element.removeEventListener('click', this.connectToggleMemory);
          });
        }

        if (this.showMoreButtons.length) {
          this.showMoreButtons.forEach((button) => {
            button.addEventListener('click', this.connectShowHiddenOptions);
          });
        }
      }

      expandingEvents() {
        if (this.showMoreButtons.length) {
          this.showMoreButtons.forEach((button) => {
            button.addEventListener('click', throttle$1(this.connectShowHiddenOptions, 500));
          });
        }
      }

      showHiddenOptions(evt) {
        const element = evt.target.hasAttribute(selectors$v.showMore) ? evt.target : evt.target.closest(`[${selectors$v.showMore}]`);

        element.classList.add(classes$d.hidden);

        element.previousElementSibling.querySelectorAll(`.${classes$d.hidden}`).forEach((option) => {
          option.classList.remove(classes$d.hidden);
        });
      }

      connectToggle() {
        this.filtersToggleButtons.forEach((button) => {
          button.addEventListener('click', this.connectToggleMemory.bind(this));
        });
      }

      connectToggleFunction(evt) {
        if (window.innerWidth < window.theme.sizes.medium) {
          const ariaExpanded = evt.currentTarget.getAttribute('aria-expanded') === 'true';
          if (ariaExpanded) {
            this.hideFilters();
          } else {
            this.showFilters();
          }
        }
      }

      showFilters() {
        // animates after display none is removed
        setTimeout(() => {
          this.filtersToggleButtons.forEach((btn) => btn.setAttribute('aria-expanded', true));
          this.filtersToggleButtons.forEach((btn) => btn.classList.add(classes$d.show));
          this.form.classList.add(classes$d.show);
          document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
          this.form.querySelector(selectors$v.focusable).focus();
        }, 10);
      }

      hideFilters() {
        this.filtersToggleButtons.forEach((btn) => btn.setAttribute('aria-expanded', false));
        this.filtersToggleButtons.forEach((btn) => btn.classList.remove(classes$d.show));
        this.filtersToggleButtons.forEach((btn) => btn.classList.remove(classes$d.defaultVisible));
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        this.form.classList.remove(classes$d.show);
      }
    }

    const collectionFiltersSidebar = {
      onLoad() {
        sections$g[this.id] = [];
        const wrappers = this.container.querySelectorAll(`[${selectors$v.filtersWrappper}]`);
        wrappers.forEach((wrapper) => {
          sections$g[this.id].push(new Filters(wrapper));
        });
      },
      onUnload: function () {
        sections$g[this.id].forEach((filters) => {
          if (typeof filters.unload === 'function') {
            filters.unload();
          }
        });
      },
    };

    const selectors$u = {
      rangeSlider: '[data-range-slider]',
      rangeDotLeft: '[data-range-left]',
      rangeDotRight: '[data-range-right]',
      rangeLine: '[data-range-line]',
      rangeHolder: '[data-range-holder]',
      dataMin: 'data-se-min',
      dataMax: 'data-se-max',
      dataMinValue: 'data-se-min-value',
      dataMaxValue: 'data-se-max-value',
      dataStep: 'data-se-step',
      dataFilterUpdate: 'data-range-filter-update',
      priceMin: '[data-field-price-min]',
      priceMax: '[data-field-price-max]',
    };

    const classes$c = {
      isInitialized: 'is-initialized',
    };

    class RangeSlider {
      constructor(section) {
        this.container = section.container;
        this.slider = section.querySelector(selectors$u.rangeSlider);

        if (this.slider) {
          this.onMoveEvent = (event) => this.onMove(event);
          this.onStopEvent = (event) => this.onStop(event);
          this.onStartEvent = (event) => this.onStart(event);
          this.onResize = () => this.setDefaultValues();
          this.startX = 0;
          this.x = 0;

          // retrieve touch button
          this.touchLeft = this.slider.querySelector(selectors$u.rangeDotLeft);
          this.touchRight = this.slider.querySelector(selectors$u.rangeDotRight);
          this.lineSpan = this.slider.querySelector(selectors$u.rangeLine);

          // get some properties
          this.min = parseFloat(this.slider.getAttribute(selectors$u.dataMin));
          this.max = parseFloat(this.slider.getAttribute(selectors$u.dataMax));

          this.step = 0.0;

          // normalize flag
          this.normalizeFact = 26;

          this.init();

          document.addEventListener('theme:reset-price-range', () => {
            this.setDefaultValues();
          });

          window.addEventListener('resize', this.onResize);
        }
      }

      init() {
        this.setDefaultValues();

        // link events
        this.touchLeft.addEventListener('mousedown', this.onStartEvent);
        this.touchRight.addEventListener('mousedown', this.onStartEvent);
        this.touchLeft.addEventListener('touchstart', this.onStartEvent);
        this.touchRight.addEventListener('touchstart', this.onStartEvent);

        // initialize
        this.slider.classList.add(classes$c.isInitialized);
      }

      setDefaultValues() {
        // retrieve default values
        let defaultMinValue = this.min;
        if (this.slider.hasAttribute(selectors$u.dataMinValue)) {
          defaultMinValue = parseFloat(this.slider.getAttribute(selectors$u.dataMinValue));
        }
        let defaultMaxValue = this.max;

        if (this.slider.hasAttribute(selectors$u.dataMaxValue)) {
          defaultMaxValue = parseFloat(this.slider.getAttribute(selectors$u.dataMaxValue));
        }

        // check values are correct
        if (defaultMinValue < this.min) {
          defaultMinValue = this.min;
        }

        if (defaultMaxValue > this.max) {
          defaultMaxValue = this.max;
        }

        if (defaultMinValue > defaultMaxValue) {
          defaultMinValue = defaultMaxValue;
        }

        if (this.slider.getAttribute(selectors$u.dataStep)) {
          this.step = Math.abs(parseFloat(this.slider.getAttribute(selectors$u.dataStep)));
        }

        // initial reset
        this.reset();

        // usefull values, min, max, normalize fact is the width of both touch buttons
        this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
        this.selectedTouch = null;
        this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;

        // set defualt values
        this.setMinValue(defaultMinValue);
        this.setMaxValue(defaultMaxValue);
      }

      reset() {
        this.touchLeft.style.left = '0px';
        this.touchRight.style.left = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
        this.lineSpan.style.marginLeft = '0px';
        this.lineSpan.style.width = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
        this.startX = 0;
        this.x = 0;
      }

      setMinValue(minValue) {
        const ratio = (minValue - this.min) / (this.max - this.min);
        this.touchLeft.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact))) + 'px';
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
        this.slider.setAttribute(selectors$u.dataMinValue, minValue);
      }

      setMaxValue(maxValue) {
        const ratio = (maxValue - this.min) / (this.max - this.min);
        this.touchRight.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact)) + this.normalizeFact) + 'px';
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
        this.slider.setAttribute(selectors$u.dataMaxValue, maxValue);
      }

      onStart(event) {
        // Prevent default dragging of selected content
        event.preventDefault();
        let eventTouch = event;

        if (event.touches) {
          eventTouch = event.touches[0];
        }

        if (event.currentTarget === this.touchLeft) {
          this.x = this.touchLeft.offsetLeft;
        } else if (event.currentTarget === this.touchRight) {
          this.x = this.touchRight.offsetLeft;
        }

        this.startX = eventTouch.pageX - this.x;
        this.selectedTouch = event.currentTarget;
        document.addEventListener('mousemove', this.onMoveEvent);
        document.addEventListener('mouseup', this.onStopEvent);
        document.addEventListener('touchmove', this.onMoveEvent);
        document.addEventListener('touchend', this.onStopEvent);
      }

      onMove(event) {
        let eventTouch = event;

        if (event.touches) {
          eventTouch = event.touches[0];
        }

        this.x = eventTouch.pageX - this.startX;

        if (this.selectedTouch === this.touchLeft) {
          if (this.x > this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10) {
            this.x = this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10;
          } else if (this.x < 0) {
            this.x = 0;
          }

          this.selectedTouch.style.left = this.x + 'px';
        } else if (this.selectedTouch === this.touchRight) {
          if (this.x < this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10) {
            this.x = this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10;
          } else if (this.x > this.maxX) {
            this.x = this.maxX;
          }
          this.selectedTouch.style.left = this.x + 'px';
        }

        // update line span
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';

        // write new value
        this.calculateValue();

        // call on change
        if (this.slider.getAttribute('on-change')) {
          const fn = new Function('min, max', this.slider.getAttribute('on-change'));
          fn(this.slider.getAttribute(selectors$u.dataMinValue), this.slider.getAttribute(selectors$u.dataMaxValue));
        }

        this.onChange(this.slider.getAttribute(selectors$u.dataMinValue), this.slider.getAttribute(selectors$u.dataMaxValue));
      }

      onStop(event) {
        document.removeEventListener('mousemove', this.onMoveEvent);
        document.removeEventListener('mouseup', this.onStopEvent);
        document.removeEventListener('touchmove', this.onMoveEvent);
        document.removeEventListener('touchend', this.onStopEvent);

        this.selectedTouch = null;

        // write new value
        this.calculateValue();

        // call did changed
        this.onChanged(this.slider.getAttribute(selectors$u.dataMinValue), this.slider.getAttribute(selectors$u.dataMaxValue));
      }

      onChange(min, max) {
        const rangeHolder = this.slider.closest(selectors$u.rangeHolder);
        if (rangeHolder) {
          const priceMin = rangeHolder.querySelector(selectors$u.priceMin);
          const priceMax = rangeHolder.querySelector(selectors$u.priceMax);

          if (priceMin && priceMax) {
            priceMin.value = min;
            priceMax.value = max;
          }
        }
      }

      onChanged(min, max) {
        if (this.slider.hasAttribute(selectors$u.dataFilterUpdate)) {
          this.slider.dispatchEvent(new CustomEvent('range:filter:update', {bubbles: true}));
        }
      }

      calculateValue() {
        const newValue = (this.lineSpan.offsetWidth - this.normalizeFact) / this.initialValue;
        let minValue = this.lineSpan.offsetLeft / this.initialValue;
        let maxValue = minValue + newValue;

        minValue = minValue * (this.max - this.min) + this.min;
        maxValue = maxValue * (this.max - this.min) + this.min;

        if (this.step !== 0.0) {
          let multi = Math.floor(minValue / this.step);
          minValue = this.step * multi;

          multi = Math.floor(maxValue / this.step);
          maxValue = this.step * multi;
        }

        if (this.selectedTouch === this.touchLeft) {
          this.slider.setAttribute(selectors$u.dataMinValue, minValue);
        }

        if (this.selectedTouch === this.touchRight) {
          this.slider.setAttribute(selectors$u.dataMaxValue, maxValue);
        }
      }

      unload() {
        window.removeEventListener('resize', this.onResize);
        this.touchLeft.removeEventListener('mousedown', this.onStartEvent);
        this.touchRight.removeEventListener('mousedown', this.onStartEvent);
        this.touchLeft.removeEventListener('touchstart', this.onStartEvent);
        this.touchRight.removeEventListener('touchstart', this.onStartEvent);
      }
    }

    const selectors$t = {
      wrapper: '[data-swapper-wrapper]',
      target: '[data-swapper-target]',
      input: '[data-swapper-input]',
      hover: 'data-swapper-hover',
    };

    let sections$f = {};

    class Swapper {
      constructor(el) {
        this.container = el;
        this.target = this.container.querySelector(selectors$t.target);
        this.inputs = this.container.querySelectorAll(selectors$t.input);
        this.hovers = this.container.querySelectorAll(`[${selectors$t.hover}]`);

        if (this.target && this.hovers.length) {
          this.deafaultContent = this.target.innerHTML;
          this.init();
        }
      }

      init() {
        this.inputs.forEach((input) => {
          input.addEventListener(
            'change',
            function () {
              this.deafaultContent = input.getAttribute('value');
            }.bind(this)
          );
        });

        this.hovers.forEach((hover) => {
          hover.addEventListener(
            'mouseenter',
            function () {
              const newContent = hover.getAttribute(selectors$t.hover);
              this.target.innerHTML = `${newContent}`;
            }.bind(this)
          );
          hover.addEventListener(
            'mouseleave',
            function () {
              this.target.innerHTML = this.deafaultContent;
            }.bind(this)
          );
        });
      }
    }

    function makeSwappers(instance) {
      sections$f[instance.id] = [];
      const els = instance.container.querySelectorAll(selectors$t.wrapper);
      els.forEach((el) => {
        sections$f[instance.id].push(new Swapper(el));
      });
    }

    const swapperSection = {
      onLoad() {
        makeSwappers(this);
      },
    };

    const selectors$s = {
      form: '[data-sidebar-filter-form]',
      inputs: 'input, select, label, textarea',
      priceMin: '[data-field-price-min]',
      priceMax: '[data-field-price-max]',
      priceMinValue: 'data-field-price-min',
      priceMaxValue: 'data-field-price-max',
      rangeMin: '[data-se-min-value]',
      rangeMax: '[data-se-max-value]',
      rangeMinValue: 'data-se-min-value',
      rangeMaxValue: 'data-se-max-value',
      rangeMinDefault: 'data-se-min',
      rangeMaxDefault: 'data-se-max',
      colorFilter: '[data-color-filter]',
    };

    class FiltersForm {
      constructor(section) {
        this.form = section.container.querySelector(selectors$s.form);
        this.filtersInputs = [];

        if (this.form) {
          new RangeSlider(this.form);
          this.filtersInputs = this.form.querySelectorAll(selectors$s.inputs);
          this.priceMin = this.form.querySelector(selectors$s.priceMin);
          this.priceMax = this.form.querySelector(selectors$s.priceMax);
          this.rangeMin = this.form.querySelector(selectors$s.rangeMin);
          this.rangeMax = this.form.querySelector(selectors$s.rangeMax);

          this.init();
        }
      }

      init() {
        // Color swatches tooltips
        const colorFilters = this.form.querySelectorAll(selectors$s.colorFilter);

        colorFilters.forEach((filter) => {
          new Swapper(filter);
        });

        if (this.filtersInputs.length) {
          this.filtersInputs.forEach((el) => {
            el.addEventListener(
              'input',
              debounce$1(() => {
                if (this.form && typeof this.form.submit === 'function') {
                  if (el.hasAttribute(selectors$s.priceMinValue) || el.hasAttribute(selectors$s.priceMaxValue)) {
                    const rangeMinDefault = parseInt(this.rangeMin.getAttribute(selectors$s.rangeMinDefault));
                    const rangeMaxDefault = parseInt(this.rangeMax.getAttribute(selectors$s.rangeMaxDefault));

                    if (this.priceMin.value && !this.priceMax.value) {
                      this.priceMax.value = rangeMaxDefault;
                    }

                    if (this.priceMax.value && !this.priceMin.value) {
                      this.priceMin.value = rangeMinDefault;
                    }

                    if (this.priceMin.value <= rangeMinDefault && this.priceMax.value >= rangeMaxDefault) {
                      this.priceMin.placeholder = rangeMinDefault;
                      this.priceMax.placeholder = rangeMaxDefault;
                      this.priceMin.value = '';
                      this.priceMax.value = '';
                    }
                  }

                  this.form.submit();
                }
              }, 500)
            );
          });
        }

        this.form.addEventListener('range:filter:update', () => this.updateRange());
      }

      updateRange() {
        if (this.form && typeof this.form.submit === 'function') {
          const checkElements = this.rangeMin && this.rangeMax && this.priceMin && this.priceMax;

          if (checkElements && this.rangeMin.hasAttribute(selectors$s.rangeMinValue) && this.rangeMax.hasAttribute(selectors$s.rangeMaxValue)) {
            const priceMinValue = parseInt(this.priceMin.placeholder);
            const priceMaxValue = parseInt(this.priceMax.placeholder);
            const rangeMinValue = parseInt(this.rangeMin.getAttribute(selectors$s.rangeMinValue));
            const rangeMaxValue = parseInt(this.rangeMax.getAttribute(selectors$s.rangeMaxValue));

            if (priceMinValue !== rangeMinValue || priceMaxValue !== rangeMaxValue) {
              this.priceMin.value = rangeMinValue;
              this.priceMax.value = rangeMaxValue;

              this.priceMin.dispatchEvent(new CustomEvent('input', {bubbles: true}));
              this.priceMax.dispatchEvent(new CustomEvent('input', {bubbles: true}));
            }
          }
        }
      }
    }

    const collectionFiltersForm = {
      onLoad() {
        this.filterForm = new FiltersForm(this);
      },
      onUnload: function () {
        if (this.filterForm && typeof this.filterForm.unload === 'function') {
          this.filterForm.unload();
        }
      },
    };

    var selectors$r = {
      collectionSidebar: '[data-collection-sidebar]',
      collectionNavGrouped: '.collection-nav--grouped',
      collectionSidebarHeading: '.collection__sidebar__heading',
      linkAdd: '.link--add',
      linkRemove: '.link--remove',
    };

    class Collection {
      constructor(section) {
        this.container = section.container;
        this.sidebar = this.container.querySelector(selectors$r.collectionSidebar);
        this.init();
      }

      init() {
        this.removeUnusableFilters();
      }

      removeUnusableFilters() {
        const collectionNavGrouped = this.container.querySelectorAll(selectors$r.collectionNavGrouped);
        if (collectionNavGrouped.length > 0) {
          collectionNavGrouped.forEach((element) => {
            const linkAdd = element.querySelector(selectors$r.linkAdd);
            const linkRemove = element.querySelector(selectors$r.linkRemove);

            if (!linkAdd && !linkRemove) {
              hideElement(element);
              hideElement(element.parentElement.querySelector(selectors$r.collectionSidebarHeading));
            }
          });
        }
      }
    }

    const collectionSection = {
      onLoad() {
        this.collection = new Collection(this);
      },
    };

    register('collection', [collectionSection, sort, collectionFiltersSidebar, collectionFiltersForm, accordion]);

    if (!customElements.get('popout-select')) {
      customElements.define('popout-select', PopoutSelect);
    }

    const selectors$q = {
      holderItems: '[data-custom-scrollbar-items]',
      scrollbar: '[data-custom-scrollbar]',
      scrollbarTrack: '[data-custom-scrollbar-track]',
    };

    const classes$b = {
      hide: 'hide',
    };

    const sections$e = {};

    class CustomScrollbar {
      constructor(holder) {
        this.holderItems = holder.querySelector(selectors$q.holderItems);
        this.scrollbar = holder.querySelector(selectors$q.scrollbar);
        this.scrollbarTrack = holder.querySelector(selectors$q.scrollbarTrack);
        this.trackWidth = 0;
        this.scrollWidth = 0;

        if (this.scrollbar && this.holderItems) {
          this.events();
          this.calculateTrackWidth();
        }
      }

      events() {
        this.holderItems.addEventListener('scroll', this.calculatePosition.bind(this));
        document.addEventListener('theme:resize:width', this.calculateTrackWidth.bind(this));
        document.addEventListener('theme:resize:width', this.calculatePosition.bind(this));
      }

      calculateTrackWidth() {
        this.scrollbarWidth = this.scrollbar.clientWidth === 0 ? this.scrollbar.parentNode.getBoundingClientRect().width : this.scrollbar.clientWidth;

        setTimeout(() => {
          this.scrollWidth =
            this.holderItems.children.length *
            (this.holderItems.children[0].clientWidth +
              Number(getComputedStyle(this.holderItems.children[0]).marginRight.replace('px', '')) +
              Number(getComputedStyle(this.holderItems.children[0]).marginLeft.replace('px', '')));

          this.trackWidth = (this.scrollbarWidth / this.scrollWidth) * 100;
          this.trackWidth = this.trackWidth < 5 ? 5 : this.trackWidth;
          this.scrollbar.style.setProperty('--track-width', `${this.trackWidth}%`);
          const hideScrollbar = this.trackWidth >= 100;
          this.scrollbar.classList.toggle(classes$b.hide, hideScrollbar);
        }, 100);
      }

      calculatePosition() {
        let position = this.holderItems.scrollLeft / (this.holderItems.scrollWidth - this.holderItems.clientWidth);
        position *= this.scrollbar.clientWidth - this.scrollbarTrack.clientWidth;
        position = position < 0 ? 0 : position;
        position = isNaN(position) ? 0 : position;

        this.scrollbar.style.setProperty('--position', `${Math.round(position)}px`);

        document.dispatchEvent(
          new CustomEvent('theme:scrollbar:scroll', {
            bubbles: true,
            detail: {
              holder: this.holderItems,
            },
          })
        );
      }
    }

    const customScrollbar = {
      onLoad() {
        sections$e[this.id] = new CustomScrollbar(this.container);
      },
    };

    const selectors$p = {
      slider: 'data-slideshow',
      slide: 'data-slide',
      slideIndex: 'data-slide-index',
      prevArrow: '[data-prev-arrow]',
      nextArrow: '[data-next-arrow]',
      sliderActions: '[data-slider-actions]',
      flickitySlider: '.flickity-slider',
      flickityDisableClass: 'flickity-disabled-mobile',
      flickityEnabled: 'flickity-enabled',
      minimumAttribute: 'data-minimum',
    };

    const config$1 = {
      minimumVisibleSlidesDesktop: 4,
      minimumVisibleSlidesTablet: 2,
      minimumVisibleSlidesSmallMobile: 1,
    };

    const classes$a = {
      hide: 'hide',
    };

    const sections$d = {};

    class DefaultSlider {
      constructor(container) {
        this.container = container;
        this.slideshow = this.container.querySelector(`[${selectors$p.slider}]`);
        this.sliderActions = this.container.querySelector(selectors$p.sliderActions);
        this.prevArrow = this.container.querySelector(selectors$p.prevArrow);
        this.nextArrow = this.container.querySelector(selectors$p.nextArrow);
        this.flkty = null;
        this.resizeEvent = () => this.resizeEvents();

        if (this.slideshow) {
          config$1.minimumVisibleSlidesDesktop = Number(this.slideshow.getAttribute(selectors$p.slider)) ? Number(this.slideshow.getAttribute(selectors$p.slider)) : config$1.minimumVisibleSlidesDesktop;
          config$1.minimumVisibleSlidesDesktop = Number(this.container.getAttribute(selectors$p.minimumAttribute))
            ? Number(this.container.getAttribute(selectors$p.minimumAttribute))
            : config$1.minimumVisibleSlidesDesktop;
          this.config = {...config$1};

          this.init();
        } else {
          this.stopSlider(true);
        }
      }

      init() {
        this.flkty = new Flickity(this.slideshow, {
          cellAlign: 'left',
          groupCells: true,
          pageDots: false,
          contain: true,
          prevNextButtons: false,
          watchCSS: true,
        });

        if (this.prevArrow) {
          this.prevArrow.addEventListener('click', (e) => {
            e.preventDefault();

            this.flkty.previous();
          });
        }

        if (this.nextArrow) {
          this.nextArrow.addEventListener('click', (e) => {
            e.preventDefault();

            this.flkty.next();
          });
        }

        this.flkty.on('change', () => this.setButtonStatus());
        this.flkty.on('select', () => {
          this.flkty.options.draggable = true;
          this.flkty.updateDraggable();
        });

        this.showSliderActions();
        this.stopSlider();

        document.addEventListener('theme:resize', this.resizeEvent);
      }

      setButtonStatus(resize = false) {
        if (this.flkty && this.flkty.slides && this.nextArrow && this.prevArrow) {
          if (resize) {
            this.flkty.reposition();
          }
          const selectedIndex = this.flkty.selectedIndex;

          if (selectedIndex == this.flkty.slides.length - 1) {
            this.nextArrow.setAttribute('disabled', '');
          } else {
            this.nextArrow.removeAttribute('disabled');
          }
          if (selectedIndex === 0) {
            this.prevArrow.setAttribute('disabled', '');
          } else {
            this.prevArrow.removeAttribute('disabled');
          }
        }
      }

      showSliderActions() {
        let hideSliderActions = true;
        if (this.flkty && this.flkty.cells && this.flkty.cells.length) {
          const showActionsForDesktop = this.flkty.cells.length > this.config.minimumVisibleSlidesDesktop && window.innerWidth >= window.theme.sizes.large;
          const showActionsForTablet = this.flkty.cells.length > this.config.minimumVisibleSlidesTablet && window.innerWidth < window.theme.sizes.large;
          const showActionsForSmallMobile = this.flkty.cells.length > this.config.minimumVisibleSlidesSmallMobile && window.innerWidth < window.theme.sizes.small;

          if (showActionsForDesktop || showActionsForTablet || showActionsForSmallMobile) {
            hideSliderActions = false;
          }
        }

        if (this.sliderActions) {
          this.sliderActions.classList.toggle(classes$a.hide, hideSliderActions);
        }
      }

      stopSlider() {
        if (window.innerWidth < window.theme.sizes.medium && this.slideshow?.classList.contains(selectors$p.flickityDisableClass)) {
          new CustomScrollbar(this.container);
        }
      }

      resizeEvents() {
        this.setButtonStatus(true);
        this.showSliderActions();
        this.stopSlider();
      }

      unload() {
        document.removeEventListener('theme:resize', this.resizeEvent);
        if (this.flkty) {
          this.flkty.destroy();
        }
      }

      onBlockSelect(evt) {
        if (this.slideshow) {
          const currentSlide = this.slideshow.querySelector(`[${selectors$p.slide}="${evt.detail.blockId}"]`);

          if (currentSlide) {
            const slideIndex = parseInt(currentSlide.getAttribute(selectors$p.slideIndex));

            if (this.flkty && this.flkty.element && this.flkty.element.classList.contains(selectors$p.flickityEnabled)) {
              this.flkty.selectCell(slideIndex);
            }
          }
        }
      }
    }

    const slider = {
      onLoad() {
        sections$d[this.id] = new DefaultSlider(this.container);
      },
      onBlockSelect(evt) {
        if (typeof sections$d[this.id].onBlockSelect === 'function') {
          sections$d[this.id].onBlockSelect(evt);
        }
      },
      onUnload() {
        if (typeof sections$d[this.id].unload === 'function') {
          sections$d[this.id].unload();
        }
      },
    };

    register('section-collection', slider);

    function getScript(url, callback, callbackError) {
      let head = document.getElementsByTagName('head')[0];
      let done = false;
      let script = document.createElement('script');
      script.src = url;

      // Attach handlers for all browsers
      script.onload = script.onreadystatechange = function () {
        if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
          done = true;
          callback();
        } else {
          callbackError();
        }
      };

      head.appendChild(script);
    }

    const loaders$1 = {};
    window.isYoutubeAPILoaded = false;

    function loadScript$1(options = {}) {
      if (!options.type) {
        options.type = 'json';
      }

      if (options.url) {
        if (loaders$1[options.url]) {
          return loaders$1[options.url];
        } else {
          return getScriptWithPromise$1(options.url, options.type);
        }
      } else if (options.json) {
        if (loaders$1[options.json]) {
          return Promise.resolve(loaders$1[options.json]);
        } else {
          return window
            .fetch(options.json)
            .then((response) => {
              return response.json();
            })
            .then((response) => {
              loaders$1[options.json] = response;
              return response;
            });
        }
      } else if (options.name) {
        const key = ''.concat(options.name, options.version);
        if (loaders$1[key]) {
          return loaders$1[key];
        } else {
          return loadShopifyWithPromise$1(options);
        }
      } else {
        return Promise.reject();
      }
    }

    function getScriptWithPromise$1(url, type) {
      const loader = new Promise((resolve, reject) => {
        if (type === 'text') {
          fetch(url)
            .then((response) => response.text())
            .then((data) => {
              resolve(data);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          getScript(
            url,
            function () {
              resolve();
            },
            function () {
              reject();
            }
          );
        }
      });

      loaders$1[url] = loader;
      return loader;
    }

    function loadShopifyWithPromise$1(options) {
      const key = ''.concat(options.name, options.version);
      const loader = new Promise((resolve, reject) => {
        try {
          window.Shopify.loadFeatures([
            {
              name: options.name,
              version: options.version,
              onLoad: (err) => {
                onLoadFromShopify$1(resolve, reject, err);
              },
            },
          ]);
        } catch (err) {
          reject(err);
        }
      });
      loaders$1[key] = loader;
      return loader;
    }

    function onLoadFromShopify$1(resolve, reject, err) {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    }

    var touched = false;

    function isTouch() {
      return touched;
    }

    function wasTouched() {
      touched = true;
      document.removeEventListener('touchstart', wasTouched, {passive: true});
      document.querySelector('body').classList.add('supports-touch');
      document.dispatchEvent(
        new CustomEvent('theme:touch', {
          bubbles: true,
        })
      );
    }

    document.addEventListener('touchstart', wasTouched, {passive: true});

    const defaultOptions$1 = {
      cc_load_policy: 1,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      controls: 1,
      showinfo: 0,
      ecver: 2,
      fs: 1,
      rel: 0,
    };

    function embedYoutube(uniqueKey, options) {
      const playerOptions = {
        ...defaultOptions$1,
        ...options,
      };
      const playerWrapper = document.querySelector(`[data-player="${uniqueKey}"]`);
      const playerElement = playerWrapper.querySelector('iframe, [data-replace]');
      const youtubeKey = playerWrapper.querySelector('[data-video-id]').getAttribute('data-video-id');
      if (!window.isYoutubeAPILoaded) {
        loadScript$1({url: 'https://www.youtube.com/iframe_api'});
        window.isYoutubeAPILoaded = true;
      }
      const playerPromise = window.youtubeLoaderPromise
        .then(function () {
          let player = new window.YT.Player(playerElement, {
            videoId: youtubeKey,
            playerVars: {
              ...playerOptions,
            },
          });
          playerWrapper.addEventListener('pause', function () {
            try {
              if (player.pauseVideo) {
                player.pauseVideo();
              }
            } catch (e) {
              console.warn(e);
            }
          });
          playerWrapper.addEventListener('play-desktop', function () {
            if (!isTouch()) {
              playerWrapper.dispatchEvent(new Event('play'));
            }
          });
          playerWrapper.addEventListener('play', function () {
            try {
              if (player.playVideo) {
                player.playVideo();
              } else {
                player.addEventListener('onReady', function (event) {
                  event.target.playVideo();
                });
              }
            } catch (e) {
              console.warn(e);
            }
          });
          playerWrapper.addEventListener('destroy', function () {
            try {
              if (player.destroy) {
                player.destroy();
              }
            } catch (e) {
              console.warn(e);
            }
          });
          return player;
        })
        .catch(function (err) {
          console.error(err);
        });
      return playerPromise;
    }

    window.youtubeLoaderPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = function () {
        resolve();
      };
    });

    const defaultOptions = {
      autoplay: true,
      loop: true,
      controls: true,
      muted: false,
      playsinline: true,
    };

    function embedVimeo(uniqueKey, options) {
      const playerOptions = {
        ...defaultOptions,
        ...options,
      };
      const playerWrapper = document.querySelector(`[data-player="${uniqueKey}"]`);
      const playerElement = playerWrapper.querySelector('iframe, [data-replace]');
      const vimeoKey = playerWrapper.querySelector('[data-video-id]').getAttribute('data-video-id');
      const loadedPromise = loadScript$1({url: 'https://player.vimeo.com/api/player.js'});
      const vimeoSelector = `select-${uniqueKey}`;
      playerElement.setAttribute('id', vimeoSelector);
      const returnPlayer = loadedPromise
        .then(function () {
          const player = new window.Vimeo.Player(vimeoSelector, {
            ...playerOptions,
            id: vimeoKey,
          });
          playerWrapper.addEventListener('pause', function () {
            try {
              if (player.pause) {
                player.pause();
              }
            } catch (e) {
              console.warn(e);
            }
          });
          playerWrapper.addEventListener('play-desktop', function () {
            if (!isTouch()) {
              playerWrapper.dispatchEvent(new Event('play'));
            }
          });
          playerWrapper.addEventListener('play', function () {
            if (player.play) {
              player.play();
            }
          });
          playerWrapper.addEventListener('destroy', function () {
            try {
              if (player.destroy) {
                player.destroy();
              }
            } catch (e) {
              console.log(e);
            }
          });
          return player;
        })
        .catch(function (err) {
          console.error(err);
        });
      return returnPlayer;
    }

    const selectors$o = {
      videoPopup: '[data-video-button]',
      backgroundVideo: '[data-background-video]',
      attrUnique: 'data-unique',
      attrVideoId: 'data-video-id',
      attrVideoType: 'data-video-type',
      attrPlayer: 'data-player',
    };

    class PopupVideo {
      constructor(section) {
        this.container = section.container;
        this.triggers = this.container.querySelectorAll(selectors$o.videoPopup);
        this.backgroundVideo = this.container.querySelector(selectors$o.backgroundVideo);

        this.init();
      }

      init() {
        this.triggers.forEach((trigger) => {
          const unique = trigger.getAttribute(selectors$o.attrUnique);
          const video = trigger.getAttribute(selectors$o.attrVideoId);
          const type = trigger.getAttribute(selectors$o.attrVideoType);

          // Find the modal body, which has been moved to the document root
          // and append a unique ID for youtube and vimeo to init players.
          const uniqueKey = `${video}-${unique}`;
          const player = document.querySelector(`[${selectors$o.attrPlayer}="${uniqueKey}"]`);

          // Modal Event Logic:
          // When a modal opens it creates and plays the video
          // When a modal opens it pauses background videos in this section
          // --
          // When a modal closes it destroys the player
          // When a modal closes it plays background videos anywhere on the page
          MicroModal.init({
            onShow: () => {
              if (this.backgroundVideo && typeof this.backgroundVideo.pause === 'function') {
                this.backgroundVideo.pause();
              }
              let playerPromise = {};
              if (type === 'youtube') {
                playerPromise = embedYoutube(uniqueKey);
              } else if (type === 'vimeo') {
                playerPromise = embedVimeo(uniqueKey);
              }
              playerPromise.then(() => {
                player.dispatchEvent(new CustomEvent('play'));
              });
            },
            onClose: (modal, el, event) => {
              event.preventDefault();
              player.dispatchEvent(new CustomEvent('destroy'));
              if (this.backgroundVideo && typeof this.backgroundVideo.play === 'function') {
                this.backgroundVideo.play();
              }
            },
            openTrigger: `data-trigger-${video}-${unique}`,
          });
        });
      }
    }

    const popupVideoSection = {
      onLoad() {
        new PopupVideo(this);
      },
    };

    register('section-custom-content', [slider, popupVideoSection]);

    var sections$c = {};

    const parallaxImage = {
      onLoad() {
        sections$c[this.id] = [];
        const frames = this.container.querySelectorAll('[data-parallax-wrapper]');
        frames.forEach((frame) => {
          const inner = frame.querySelector('[data-parallax-img]');
          sections$c[this.id].push(
            new Rellax(inner, {
              center: true,
              round: true,
              frame: frame,
            })
          );
        });
      },
      onUnload: function () {
        sections$c[this.id].forEach((image) => {
          if (typeof image.destroy === 'function') {
            image.destroy();
          }
        });
      },
    };

    const selectors$n = {
      scrollElement: '[data-block-scroll]',
      flickityEnabled: 'flickity-enabled',
    };

    const sections$b = {};

    class BlockScroll {
      constructor(el) {
        this.container = el.container;
      }

      onBlockSelect(evt) {
        const scrollElement = this.container.querySelector(selectors$n.scrollElement);

        if (scrollElement && !scrollElement.classList.contains(selectors$n.flickityEnabled)) {
          const currentElement = evt.srcElement;

          if (currentElement) {
            scrollElement.scrollTo({
              top: 0,
              left: currentElement.offsetLeft,
              behavior: 'smooth',
            });
          }
        }
      }
    }

    const blockScroll = {
      onLoad() {
        sections$b[this.id] = new BlockScroll(this);
      },
      onBlockSelect(e) {
        sections$b[this.id].onBlockSelect(e);
      },
    };

    const sections$a = {};

    const selectors$m = {
      slideshow: '[data-section-timeline-slideshow]',
      firstText: '[data-timeline-text-height]',
      overlay: '[data-has-image]',
      flickityDisableClass: 'flickity-disabled-mobile',
      flickityEnabled: 'flickity-enabled',
    };

    class IndexTimeline {
      constructor(section) {
        this.section = section;
        this.container = section.container;
        this.slides = this.container.querySelector(selectors$m.slideshow);

        this.firstText = this.container.querySelector(selectors$m.firstText);
        this.overlay = this.container.querySelector(selectors$m.overlay);

        if (this.overlay && this.firstText) {
          const upper = `-${this.firstText.clientHeight}px`;
          this.container.style.setProperty('--timeshow-offset', upper);
        }

        this.init();
      }

      init() {
        this.flkty = new Flickity(this.slides, {
          cellAlign: 'left',
          adaptiveHeight: false,
          groupCells: true,
          pageDots: false,
          contain: true,
          watchCSS: true,
        });

        this.flkty.on('select', () => {
          this.flkty.options.draggable = true;
          this.flkty.updateDraggable();
        });

        this.stopSlider();

        document.addEventListener('theme:resize', () => {
          this.stopSlider();
        });
      }

      stopSlider() {
        if (window.innerWidth < window.theme.sizes.medium && this.slides?.classList.contains(selectors$m.flickityDisableClass)) {
          new CustomScrollbar(this.container);
        }
      }

      onBlockSelect(evt) {
        const indexEl = evt.target.closest('[data-slideshow-index]');
        const slideIndex = indexEl.getAttribute('data-slideshow-index');
        const select = parseInt(slideIndex, 10);
        if (this.flkty && this.flkty.element && this.flkty.element.classList.contains(selectors$m.flickityEnabled)) {
          this.flkty.selectCell(select);
          this.flkty.pausePlayer();
        }
      }

      unload() {
        if (this.flickity) {
          this.flkty.destroy();
        }
      }
    }

    const timelineSection = {
      onLoad() {
        sections$a[this.id] = new IndexTimeline(this);
      },
      onUnload() {
        if (typeof sections$a[this.id].unload === 'function') {
          sections$a[this.id].unload();
        }
      },
      onBlockSelect(evt) {
        if (typeof sections$a[this.id].onBlockSelect === 'function') {
          sections$a[this.id].onBlockSelect(evt);
        }
      },
    };

    register('section-timeline', [timelineSection, parallaxImage, blockScroll]);

    const footerSection = {
      onLoad() {
        // Lighthouse fires security warning for the Shopify link.
        var shopifyLink = document.querySelector('[data-powered-link] a');
        if (shopifyLink) {
          shopifyLink.setAttribute('rel', 'noopener');
        }
      },
    };

    register('footer', [footerSection]);

    if (!customElements.get('popout-select')) {
      customElements.define('popout-select', PopoutSelect);
    }

    const tokensReducer = (acc, token) => {
      const {el, elStyle, elHeight, rowsLimit, rowsWrapped, options} = acc;
      let oldBuffer = acc.buffer;
      let newBuffer = oldBuffer;

      if (rowsWrapped === rowsLimit + 1) {
        return {...acc};
      }
      const textBeforeWrap = oldBuffer;
      let newRowsWrapped = rowsWrapped;
      let newHeight = elHeight;
      el.innerHTML = newBuffer = oldBuffer.length ? `${oldBuffer}${options.delimiter}${token}${options.replaceStr}` : `${token}${options.replaceStr}`;

      if (parseFloat(elStyle.height) > parseFloat(elHeight)) {
        newRowsWrapped++;
        newHeight = elStyle.height;

        if (newRowsWrapped === rowsLimit + 1) {
          el.innerHTML = newBuffer = textBeforeWrap[textBeforeWrap.length - 1] === '.' && options.replaceStr === '...' ? `${textBeforeWrap}..` : `${textBeforeWrap}${options.replaceStr}`;

          return {...acc, elHeight: newHeight, rowsWrapped: newRowsWrapped};
        }
      }

      el.innerHTML = newBuffer = textBeforeWrap.length ? `${textBeforeWrap}${options.delimiter}${token}` : `${token}`;

      return {...acc, buffer: newBuffer, elHeight: newHeight, rowsWrapped: newRowsWrapped};
    };

    const ellipsis = (selector = '', rows = 1, options = {}) => {
      const defaultOptions = {
        replaceStr: '...',
        debounceDelay: 250,
        delimiter: ' ',
      };

      const opts = {...defaultOptions, ...options};

      const elements =
        selector &&
        (selector instanceof NodeList
          ? selector
          : selector.nodeType === 1 // if node type is Node.ELEMENT_NODE
          ? [selector] // wrap it in (NodeList) if it is a single node
          : document.querySelectorAll(selector));

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const elementHtml = el.innerHTML;
        const commentRegex = /<!--[\s\S]*?-->/g;
        const htmlWithoutComments = elementHtml.replace(commentRegex, '');
        const splittedText = htmlWithoutComments.split(opts.delimiter);

        el.innerHTML = '';
        const elStyle = window.getComputedStyle(el);

        splittedText.reduce(tokensReducer, {
          el,
          buffer: el.innerHTML,
          elStyle,
          elHeight: 0,
          rowsLimit: rows,
          rowsWrapped: 0,
          options: opts,
        });
      }
    };

    const selectors$l = {
      focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    function modal(unique) {
      const uniqueID = `data-popup-${unique}`;
      MicroModal.init({
        openTrigger: uniqueID,
        disableScroll: true,
        onShow: (modal, el, event) => {
          event.preventDefault();
          const firstFocus = modal.querySelector(selectors$l.focusable);
          trapFocus(modal, {elementToFocus: firstFocus});
        },
        onClose: (modal, el, event) => {
          event.preventDefault();
          removeTrapFocus();
          el.focus();
        },
      });
    }

    var modelJsonSections = {};
    var models = {};
    var xrButtons = {};

    const selectors$k = {
      productMediaWrapper: '[data-product-single-media-wrapper]',
      productSlideshow: '[data-product-slideshow]',
      productScrollbar: 'data-custom-scrollbar-items',
      productXr: '[data-shopify-xr]',
      dataMediaId: 'data-media-id',
      dataModelId: 'data-model-id',
      modelViewer: 'model-viewer',
      dataModel3d: 'data-shopify-model3d-id',
      modelJson: '#ModelJson-',
    };

    function initSectionModels(modelViewerContainer, sectionId) {
      modelJsonSections[sectionId] = {
        loaded: false,
      };

      const mediaId = modelViewerContainer.getAttribute(selectors$k.dataMediaId);
      const modelViewerElement = modelViewerContainer.querySelector(selectors$k.modelViewer);
      const modelId = modelViewerElement.getAttribute(selectors$k.dataModelId);
      const xrButton = modelViewerContainer.closest(selectors$k.productSlideshow).parentElement.querySelector(selectors$k.productXr);
      xrButtons[sectionId] = {
        $element: xrButton,
        defaultId: modelId,
      };

      models[mediaId] = {
        modelId: modelId,
        mediaId: mediaId,
        sectionId: sectionId,
        $container: modelViewerContainer,
        $element: modelViewerElement,
      };

      window.Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: setupShopifyXr,
        },
        {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: setupModelViewerUi,
        },
      ]);
    }

    function setupShopifyXr(errors) {
      if (errors) {
        console.warn(errors);
        return;
      }
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function () {
          setupShopifyXr();
        });
        return;
      }

      for (const sectionId in modelJsonSections) {
        if (modelJsonSections.hasOwnProperty(sectionId)) {
          const modelSection = modelJsonSections[sectionId];
          if (modelSection.loaded) continue;

          const modelJson = document.querySelector(`${selectors$k.modelJson}${sectionId}`);
          if (modelJson) {
            window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
            modelSection.loaded = true;
          }
        }
      }
      window.ShopifyXR.setupXRElements();
    }

    function setupModelViewerUi(errors) {
      if (errors) {
        console.warn(errors);
        return;
      }

      for (const key in models) {
        if (models.hasOwnProperty(key)) {
          const model = models[key];
          if (!model.modelViewerUi) {
            model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
          }
          setupModelViewerListeners(model);
        }
      }
    }

    function observeModel(model) {
      const xrButton = xrButtons[model.sectionId];

      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            const insideOfViewport = entry.intersectionRatio > 0.5;

            if (entry.target.hasAttribute(selectors$k.dataMediaId) && insideOfViewport) {
              xrButton.$element.setAttribute(selectors$k.dataModel3d, entry.target.getAttribute(selectors$k.dataMediaId));
            }
          });
        },
        {threshold: 1}
      );

      observer.observe(model.$container);
    }

    function setupModelViewerListeners(model) {
      const xrButton = xrButtons[model.sectionId];

      model.$container.addEventListener('pause', function () {
        if (model.modelViewerUi.pause) {
          model.modelViewerUi.pause();
        }
      });
      model.$container.addEventListener('play-desktop', function () {
        if (model.modelViewerUi.play && !isTouch()) {
          model.modelViewerUi.play();
        }
        if (xrButton && xrButton.$element && model && model.modelId && selectors$k.dataModel3d) {
          xrButton.$element.setAttribute(selectors$k.dataModel3d, model.modelId);
        }
      });
      model.$container.addEventListener('play', function () {
        if (model.modelViewerUi.play) {
          model.modelViewerUi.play();
        }
      });
      model.$container.addEventListener('click', function () {
        if (xrButton && xrButton.$element && model && model.modelId && selectors$k.dataModel3d) {
          xrButton.$element.setAttribute(selectors$k.dataModel3d, model.modelId);
        }
      });
      document.addEventListener('theme:scrollbar:scroll', function (event) {
        if (event.detail.holder === model.$container.parentElement) {
          observeModel(model);
        }
      });
    }

    async function productNativeVideo(uniqueKey) {
      const playerElement = document.querySelector(`[data-player="${uniqueKey}"]`);
      const videoElement = playerElement.querySelector('video');
      const videoLoad = {
        name: 'video-ui',
        version: '1.0',
      };
      await loadScript$1(videoLoad);

      const player = new window.Shopify.Plyr(videoElement);
      playerElement.addEventListener('pause', function () {
        if (player.pause) {
          player.pause();
        }
      });
      playerElement.addEventListener('play-desktop', function () {
        if (player.play && !isTouch()) {
          playerElement.dispatchEvent(new CustomEvent('play'));
        }
      });
      playerElement.addEventListener('play', function () {
        try {
          if (player.play) {
            player.play();
          } else {
            player.addEventListener('onReady', function (event) {
              event.target.play();
            });
          }
        } catch (e) {
          console.warn(e);
        }
      });
      playerElement.addEventListener('destroy', function () {
        try {
          if (player.destroy) {
            player.destroy();
          }
        } catch (e) {
          console.warn(e);
        }
      });
      return player;
    }

    const selectors$j = {
      productSlideshow: '[data-product-slideshow]',
      productThumbs: '[data-product-thumbs]',
      thumbImage: '[data-slideshow-thumbnail]',
      mediaSlide: '[data-media-slide]',
      mediaId: 'data-media-id',
      mediaSelect: 'data-media-select',
      videoPlayerNative: '[data-type="video"]',
      modelViewer: '[data-type="model"]',
      allPlayers: '[data-player]',
      videoYT: '[data-video-youtube]',
      videoVimeo: '[data-video-vimeo]',
      flickitylockHeight: 'flickity-lock-height',
      flickityDisableClass: 'flickity-disabled-mobile',
      hideClass: 'hide',
    };

    const attributes$1 = {
      mediaType: 'data-type',
      tallLayout: 'data-tall-layout',
      loopVideo: 'data-enable-video-looping',
      alignment: 'data-thumbs-align',
      upsellProduct: 'data-upsell-product',
      sliderOptions: 'data-options',
    };

    class Media {
      constructor(section) {
        this.section = section;
        this.container = section.container || section;
        this.slideshow = this.container.querySelector(selectors$j.productSlideshow);
        this.tallLayout = this.container.getAttribute(attributes$1.tallLayout) === 'true';
        this.thumbWrapper = this.container.querySelector(selectors$j.productThumbs);
        this.thumbImages = this.container.querySelectorAll(selectors$j.thumbImage);
        this.loopVideo = this.container.getAttribute(attributes$1.loopVideo) === 'true';
        this.centerAlign = this.container.getAttribute(attributes$1.alignment) === 'center';
        this.isUpsell = this.slideshow?.parentElement.hasAttribute(attributes$1.upsellProduct);

        this.flkty = null;
        this.lastMediaSelect = null;
        this.flktyThumbs = null;
        this.currentSlide = null;

        this.init();
      }

      init() {
        this.createSlider();
        this.detectVideo();
        this.detectVimeo();
        this.detect3d();
        this.stopSlider();

        document.addEventListener('theme:resize', () => {
          this.stopSlider();
        });
      }

      createSlider() {
        if (!this.slideshow || this.tallLayout || this.slideshow.children.length <= 1) {
          return;
        }

        const instance = this;
        let flickityOptions = null;

        if (this.slideshow.hasAttribute(attributes$1.sliderOptions)) {
          flickityOptions = JSON.parse(decodeURIComponent(this.slideshow.getAttribute(attributes$1.sliderOptions)));
        }

        if (!flickityOptions) {
          flickityOptions = {
            autoPlay: false,
            prevNextButtons: false,
            contain: true,
            pageDots: false,
            adaptiveHeight: true,
            wrapAround: true,
            fade: true,
            watchCSS: true,
            on: {
              ready: function () {
                if (!instance.isUpsell) {
                  instance.sliderThumbs();
                }
              },
            },
          };
        }

        this.flkty = new FlickityFade(this.slideshow, flickityOptions);
        this.flkty.resize();

        this.currentSlide = this.slideshow.querySelectorAll(selectors$j.mediaSlide)[0];
        this.setDraggable();

        this.flkty.on(
          'change',
          function (index) {
            this.currentSlide.dispatchEvent(new CustomEvent('pause'));
            this.currentSlide = this.flkty.cells[index].element;
            this.slideshow.classList.remove(selectors$j.flickitylockHeight);

            const id = this.currentSlide.getAttribute(selectors$j.mediaId);
            const currentThumb = this.thumbWrapper?.querySelector(`[${selectors$j.mediaSelect}="${id}"]`);
            // when swatch images are hidden by specific alt-text, the slider breaks on change so we select the featured variant image to "fix" it
            // Limitation: images must be in order in the media slideshow to use the alt text hack
            // Timeout is needed to slow it down a bit until the images refresh and the currentThumb variable has the right value
            setTimeout(() => {
              if (currentThumb?.classList.contains(selectors$j.hideClass)) {
                if (this.lastMediaSelect) {
                  this.slideshow.dispatchEvent(
                    new CustomEvent('theme:image:change', {
                      detail: {
                        id: this.lastMediaSelect,
                      },
                    })
                  );
                } else window.location.reload();
              }
            });
          }.bind(this)
        );

        this.flkty.on(
          'settle',
          function (index) {
            this.currentSlide = this.flkty.cells[index].element;
            const videoYT = this.currentSlide.querySelector(selectors$j.videoYT);
            if (videoYT && !this.currentSlide.querySelector('iframe')) {
              videoYT.dispatchEvent(new Event('click'));
            }
            this.setDraggable();
            this.currentSlide.dispatchEvent(new CustomEvent('play-desktop'));
            const isFocusEnabled = document.body.classList.contains(selectors$j.focusEnabled);
            if (isFocusEnabled) this.currentSlide.dispatchEvent(new Event('focus'));
            this.confirmSync();
          }.bind(this)
        );

        this.eventListeners();
      }

      stopSlider() {
        if (window.innerWidth < window.theme.sizes.medium && this.slideshow?.classList.contains(selectors$j.flickityDisableClass)) {
          new CustomScrollbar(this.container);
        }
      }

      eventListeners() {
        this.slideshow.addEventListener(
          'theme:image:change',
          function (event) {
            const mediaId = event.detail.id;
            this.lastMediaSelect = mediaId;
            const mediaIdString = `[${selectors$j.mediaId}="${mediaId}"]`;

            if (window.innerWidth >= window.theme.sizes.medium || this.isUpsell) {
              const matchesMedia = (cell) => {
                return cell.element.matches(mediaIdString);
              };
              const index = this.flkty.cells.findIndex(matchesMedia);
              this.flkty.select(index);
            } else {
              const currentCell = this.slideshow.querySelector(mediaIdString);
              this.slideshow.scrollTo({
                left: currentCell.offsetLeft,
                behavior: 'smooth',
              });
            }
          }.bind(this)
        );

        this.thumbImages.forEach((thumb) => {
          thumb.addEventListener(
            'click',
            function (event) {
              const id = event.currentTarget.getAttribute(selectors$j.mediaSelect);
              this.slideshow.dispatchEvent(
                new CustomEvent('theme:image:change', {
                  detail: {
                    id: id,
                  },
                })
              );
            }.bind(this)
          );
        });
      }

      sliderThumbs() {
        let opts = {
          freeScroll: true,
          contain: true,
          prevNextButtons: false,
          pageDots: false,
          accessibility: true,
          watchCSS: true,
          cellAlign: this.centerAlign ? 'center' : 'left',
          sync: this.slideshow,
        };
        this.flktyThumbs = new FlickitySync(this.thumbWrapper, opts);
      }

      confirmSync() {
        if (this.flktyThumbs) {
          if (this.flkty.selectedIndex !== this.flktyThumbs.selectedIndex) {
            this.flkty.resize();
          }
        }
      }

      setDraggable() {
        if (this.currentSlide) {
          const mediaType = this.currentSlide.getAttribute(attributes$1.mediaType);

          if (mediaType === 'model' || mediaType === 'video' || mediaType === 'external_video') {
            // fisrt boolean sets value, second option false to prevent refresh
            this.flkty.options.draggable = false;
            this.flkty.updateDraggable();
          } else {
            this.flkty.options.draggable = true;
            this.flkty.updateDraggable();
          }
        }
      }

      detect3d() {
        const modelViewerElements = this.container.querySelectorAll(selectors$j.modelViewer);
        if (modelViewerElements) {
          modelViewerElements.forEach((element) => {
            initSectionModels(element, this.section.id);
          });
          document.addEventListener(
            'shopify_xr_launch',
            function () {
              this.container.querySelectorAll(selectors$j.allPlayers).forEach((player) => {
                player.dispatchEvent(new CustomEvent('pause'));
              });
            }.bind(this)
          );
        }
      }

      detectVideo() {
        const playerElements = this.container.querySelectorAll(selectors$j.videoPlayerNative);
        for (var player of playerElements) {
          const uniqueKey = player.dataset.player;
          const nativePlayerPromise = productNativeVideo(uniqueKey);
          if (this.loopVideo === true) {
            nativePlayerPromise
              .then((nativePlayer) => {
                nativePlayer.loop = true;
                return nativePlayer;
              })
              .catch((err) => {
                console.error(err);
              });
          }
        }
      }

      detectVimeo() {
        const playerElements = this.container.querySelectorAll(selectors$j.videoVimeo);
        if (playerElements.length) {
          for (const player of playerElements) {
            const uniqueKey = player.dataset.player;
            const vimeoPlayerPromise = embedVimeo(uniqueKey, {
              loop: this.loopVideo,
            });
            if (this.loopVideo) {
              vimeoPlayerPromise
                .then((vimeoPlayer) => {
                  return vimeoPlayer.setLoop(true);
                })
                .catch((err) => {
                  console.error(err);
                });
            }
          }
        }
      }

      pauseAllMedia() {
        const all = this.container.querySelector(`[data-media-slide]`);
        all.dispatchEvent(new CustomEvent('pause'));
      }

      pauseOtherMedia(uniqueKey) {
        const otherMedia = this.container.querySelector(`[data-media-slide]:not([data-player="${uniqueKey}"])`);
        otherMedia.dispatchEvent(new CustomEvent('pause'));
      }

      destroy() {
        this.container.querySelectorAll(selectors$j.allPlayers).forEach((player) => {
          player.dispatchEvent(new CustomEvent('destroy'));
        });
      }
    }

    const defaults = {
      color: 'ash',
    };

    const selectors$i = {
      swatch: 'data-swatch',
      variant: 'data-swatch-variant',
      link: '[data-grid-link]',
      swatchWrapper: '[data-swatch-wrapper]',
      target: '[data-swatch-target]',
    };

    class ColorMatch {
      constructor(options = {}) {
        this.settings = {
          ...defaults,
          ...options,
        };

        this.match = this.init();
      }

      getColor() {
        return this.match;
      }

      init() {
        const getColors = loadScript$1({json: window.theme.assets.swatches});

        return getColors
          .then((colors) => {
            return this.matchColors(colors, this.settings.color);
          })
          .catch((e) => {
            console.log('failed to load swatch colors script');
            console.log(e);
          });
      }

      matchColors(colors, name) {
        let bg = '#E5E5E5';
        let img = null;
        const path = window.theme.assets.base || '/';
        const comparisonName = name.toLowerCase().replace(/\s/g, '');
        const array = colors.colors;
        if (array) {
          const variantNameMatch = (nameObject) => {
            const indexName = Object.keys(nameObject).toString();
            const neatName = indexName.toLowerCase().replace(/\s/g, '');
            return neatName === comparisonName;
          };
          const position = array.findIndex(variantNameMatch);
          if (position > -1) {
            const normalValue = Object.values(array[position])[0];
            const value = normalValue.toLowerCase();
            if (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.svg')) {
              img = `${path}${normalValue}`;
              bg = '#888888';
            } else {
              bg = normalValue;
            }
          }
        }
        return {
          color: this.settings.color,
          path: img,
          hex: bg,
        };
      }
    }

    class RadioSwatch extends HTMLElement {
      connectedCallback() {
        this.element = this.querySelector(`[${selectors$i.swatch}]`);

        if (!this.element) return;

        this.colorString = this.element.getAttribute(selectors$i.swatch);

        const matcher = new ColorMatch({color: this.colorString});

        // Set swatch color for the old-swatch system
        if (this.element.getAttribute(selectors$i.swatch) != '') {
          matcher.getColor().then((result) => {
            this.colorMatch = result;
            this.init();
          });
        }
      }

      init() {
        this.setStyles();
      }

      setStyles() {
        if (this.colorMatch.hex) {
          this.element.style.setProperty('--swatch', `${this.colorMatch.hex}`);
        }
        if (this.colorMatch.path) {
          this.element.style.setProperty('background-image', `url(${this.colorMatch.path})`);
          this.element.style.setProperty('background-size', 'cover');
        }
      }
    }

    const selectors$h = {
      drawer: '[data-pickup-drawer]',
      drawerOpen: '[data-pickup-drawer-open]',
      drawerClose: '[data-pickup-drawer-close]',
      drawerBody: '[data-pickup-body]',
    };

    const classes$9 = {
      isVisible: 'drawer--visible',
      isHidden: 'hide',
    };

    class PickupAvailability extends HTMLElement {
      connectedCallback() {
        this.container = this;
        this.drawer = this.container.querySelector(selectors$h.drawer);
        this.buttonDrawerOpen = this.container.querySelector(selectors$h.drawerOpen);
        this.buttonDrawerClose = this.container.querySelectorAll(selectors$h.drawerClose);
        this.drawerBody = this.container.querySelector(selectors$h.drawerBody);

        if (this.buttonDrawerOpen) {
          this.buttonDrawerOpen?.addEventListener('click', () => this.openDrawer());
        }

        if (this.buttonDrawerClose) {
          this.buttonDrawerClose.forEach((element) => {
            element.addEventListener('click', () => this.closeDrawer());
          });
        }
      }

      openDrawer() {
        if (this.drawer) {
          this.drawer.classList.add(classes$9.isVisible);
          document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
        }
      }

      closeDrawer() {
        if (this.drawer) {
          this.drawer.classList.remove(classes$9.isVisible);
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }
      }

      handleErrors(response) {
        if (!response.ok) {
          return response.json().then(function (json) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              json: json,
            });
            throw e;
          });
        }
        return response;
      }
    }

    const selectors$g = {
      slideshow: '[data-product-slideshow]',
      productPage: '.product__wrapper',
      formWrapper: '[data-form-wrapper]',
      productSticky: '[data-product-sticky-enabled="true"]',
      headerSticky: '[data-header-sticky="true"]',
      headerHeight: '[data-header-height]',
    };

    const attributes = {
      productSticky: 'data-product-sticky-enabled',
    };

    const classes$8 = {
      sticky: 'is-sticky',
    };

    window.theme.variables = {
      productPageSticky: false,
    };

    const sections$9 = {};

    class ProductSticky {
      constructor(section) {
        this.section = section;
        this.container = section.container;
        this.stickyEnabled = this.container.getAttribute(attributes.productSticky) === 'true';
        this.formWrapper = this.container.querySelector(selectors$g.formWrapper);
        this.stickyScrollTop = 0;
        this.scrollLastPosition = 0;
        this.stickyDefaultTop = 0;
        this.currentPoint = 0;
        this.defaultTopBottomSpacings = 30;
        this.scrollTop = window.scrollY;
        this.scrollDirectionDown = true;
        this.requestAnimationSticky = null;
        this.stickyFormLoad = true;
        this.stickyFormLastHeight = null;
        this.onChangeCounter = 0;
        this.scrollEvent = (e) => this.scrollEvents(e);
        this.resizeEvent = (e) => this.resizeEvents(e);

        // The code should execute after truncate text in product.js - 50ms
        setTimeout(() => {
          this.init();
        }, 50);
      }

      init() {
        if (this.stickyEnabled) {
          this.stickyScrollCheck();

          document.addEventListener('theme:resize', this.resizeEvent);
        }

        this.initSticky();
      }

      initSticky() {
        if (theme.variables.productPageSticky) {
          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());

          this.formWrapper.addEventListener('theme:form:sticky', (e) => {
            this.removeAnimationFrame();

            this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
          });

          document.addEventListener('theme:scroll', this.scrollEvent);
        }
      }

      scrollEvents(e) {
        this.scrollTop = e.detail.position;
        this.scrollDirectionDown = e.detail.down;

        if (!this.requestAnimationSticky) {
          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());
        }
      }

      resizeEvents(e) {
        this.stickyScrollCheck();

        document.removeEventListener('theme:scroll', this.scrollEvent);

        this.initSticky();
      }

      stickyScrollCheck() {
        const targetFormWrapper = this.container.querySelector(`${selectors$g.productPage} ${selectors$g.formWrapper}`);

        if (!targetFormWrapper) return;

        if (isDesktop()) {
          const form = this.container.querySelector(selectors$g.formWrapper);
          const slideshow = this.container.querySelector(selectors$g.slideshow);
          if (!form || !slideshow) return;
          const productCopyHeight = form.offsetHeight;
          const productImagesHeight = slideshow.offsetHeight;

          // Is the product description and form taller than window space
          // Is also shorter than the window and images
          if (productCopyHeight < productImagesHeight) {
            theme.variables.productPageSticky = true;
            targetFormWrapper.classList.add(classes$8.sticky);
          } else {
            theme.variables.productPageSticky = false;
            targetFormWrapper.classList.remove(classes$8.sticky);
          }
        } else {
          theme.variables.productPageSticky = false;
          targetFormWrapper.classList.remove(classes$8.sticky);
        }
      }

      calculateStickyPosition(e = null) {
        const isScrollLocked = document.documentElement.hasAttribute('data-scroll-locked');
        if (isScrollLocked) {
          this.removeAnimationFrame();
          return;
        }

        const eventExist = Boolean(e && e.detail);
        const isAccordion = Boolean(eventExist && e.detail.element && e.detail.element === 'accordion');
        const formWrapperHeight = this.formWrapper.offsetHeight;
        const heightDifference = window.innerHeight - formWrapperHeight - this.defaultTopBottomSpacings;
        const scrollDifference = Math.abs(this.scrollTop - this.scrollLastPosition);

        if (this.scrollDirectionDown) {
          this.stickyScrollTop -= scrollDifference;
        } else {
          this.stickyScrollTop += scrollDifference;
        }

        if (this.stickyFormLoad) {
          if (document.querySelector(selectors$g.headerSticky) && document.querySelector(selectors$g.headerHeight)) {
            this.stickyDefaultTop = parseInt(document.querySelector(selectors$g.headerHeight).getBoundingClientRect().height);
          } else {
            this.stickyDefaultTop = this.defaultTopBottomSpacings;
          }

          this.stickyScrollTop = this.stickyDefaultTop;
        }

        this.stickyScrollTop = Math.min(Math.max(this.stickyScrollTop, heightDifference), this.stickyDefaultTop);

        const differencePoint = this.stickyScrollTop - this.currentPoint;
        this.currentPoint = this.stickyFormLoad ? this.stickyScrollTop : this.currentPoint + differencePoint * 0.5;

        this.formWrapper.style.setProperty('--sticky-top', `${this.currentPoint}px`);

        this.scrollLastPosition = this.scrollTop;
        this.stickyFormLoad = false;

        if (
          (isAccordion && this.onChangeCounter <= 10) ||
          (isAccordion && this.stickyFormLastHeight !== formWrapperHeight) ||
          (this.stickyScrollTop !== this.currentPoint && this.requestAnimationSticky)
        ) {
          if (isAccordion) {
            this.onChangeCounter += 1;
          }

          if (isAccordion && this.stickyFormLastHeight !== formWrapperHeight) {
            this.onChangeCounter = 11;
          }

          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
        } else if (this.requestAnimationSticky) {
          this.removeAnimationFrame();
        }

        this.stickyFormLastHeight = formWrapperHeight;
      }

      removeAnimationFrame() {
        if (this.requestAnimationSticky) {
          cancelAnimationFrame(this.requestAnimationSticky);
          this.requestAnimationSticky = null;
          this.onChangeCounter = 0;
        }
      }

      onUnload() {
        if (this.stickyEnabled) {
          document.removeEventListener('theme:resize', this.resizeEvent);
        }

        if (theme.variables.productPageSticky) {
          document.removeEventListener('theme:scroll', this.scrollEvent);
        }
      }
    }

    const productStickySection = {
      onLoad() {
        sections$9[this.id] = new ProductSticky(this);
      },
      onUnload() {
        sections$9[this.id].onUnload();
      },
    };

    const selectors$f = {
      slideshow: '[data-product-slideshow]',
      singeImage: '[data-product-image]',
      zoomButton: '[data-zoom-button]',
      zoomWrapper: '[data-zoom-wrapper]',
      mediaId: '[data-media-id]',
      mediaIdAttr: 'data-media-id',
    };

    function productPhotoswipeZoom(container, json) {
      const loadedPromise = loadScript$1({url: window.theme.assets.photoswipe});
      const returnZoom = loadedPromise
        .then(() => {
          const PhotoSwipe = window.themePhotoswipe.PhotoSwipe.default;
          const PhotoSwipeUI = window.themePhotoswipe.PhotoSwipeUI.default;

          const triggers = container.querySelectorAll(selectors$f.zoomButton);
          triggers.forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
              const el = container.querySelector(selectors$f.zoomWrapper);
              const dataId = event.target.closest(selectors$f.mediaId).getAttribute(selectors$f.mediaIdAttr).toString();
              const items = [];
              for (let i = 0; i < json.media.length; i++) {
                if (json.media[i].media_type === 'image') {
                  items[items.length] = {
                    src: json.media[i].src,
                    w: json.media[i].width,
                    h: json.media[i].height,
                    id: json.media[i].id,
                  };
                }
              }
              const findImage = (element) => element.id.toString() === dataId;
              const index = items.findIndex(findImage);
              const options = {
                index,
                showHideOpacity: true,
                showAnimationDuration: 150,
                hideAnimationDuration: 250,
                bgOpacity: 1,
                spacing: 0,
                allowPanToNext: false,
                maxSpreadZoom: 3,
                history: false,
                loop: true,
                pinchToClose: false,
                modal: false,
                closeOnScroll: false,
                closeOnVerticalDrag: true,
                getDoubleTapZoom: function getDoubleTapZoom(isMouseClick, item) {
                  if (isMouseClick) {
                    return 1.67;
                  } else {
                    return item.initialZoomLevel < 0.7 ? 1 : 1.3;
                  }
                },
                getThumbBoundsFn: function getThumbBoundsFn() {
                  let imageLocation = container.querySelector(selectors$f.slideshow);
                  if (!imageLocation) {
                    imageLocation = container.querySelector(selectors$f.singeImage);
                  }
                  const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                  const rect = imageLocation.getBoundingClientRect();
                  return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
                },
              };
              document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
              // Initializes and opens PhotoSwipe
              let windowWidth = null;
              const gallery = new PhotoSwipe(el, PhotoSwipeUI, items, options);
              gallery.updateSize = new Proxy(gallery.updateSize, {
                apply: (target) => windowWidth !== window.innerWidth && (target(options), (windowWidth = window.innerWidth)),
              });
              gallery.init();
              gallery.listen('close', function () {
                document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
              });
            });
          });
        })
        .catch((e) => console.error(e));
      return returnZoom;
    }

    class ProductComplimentary extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        fetch(this.dataset.url)
          .then((response) => response.text())
          .then((text) => {
            const fresh = document.createElement('div');
            fresh.innerHTML = text;
            const newContent = fresh.querySelector('[data-api-content]');
            if (newContent) {
              this.innerHTML = newContent.innerHTML;
            }
            const loader = this.closest('[data-product-complimentary-loaded]');
            if (loader && newContent.innerHTML.trim() !== '') {
              // js-unloaded state hides the wrapper pre-render and
              // keeps it hidden for empty recommendations
              loader.classList.remove('js-unloaded');
            }
            const els = this.querySelectorAll('[data-add-action-wrapper]');
            els.forEach((el) => {
              new ProductAddButton$1(el);
            });
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }

    const selectors$e = {
      urlInput: '[data-share-url]',
      section: 'data-section-type',
      shareDetails: '[data-share-details]',
      shareSummary: '[data-share-summary]',
      shareCopy: '[data-share-copy]',
      shareButton: '[data-share-button]',
      closeButton: '[data-close-button]',
      successMessage: '[data-success-message]',
      shareHolder: '[data-share-holder]',
    };

    const classes$7 = {
      hidden: 'is-hidden',
    };

    class ShareButton extends HTMLElement {
      connectedCallback() {
        this.container = this.closest(`[${selectors$e.section}]`);
        this.mainDetailsToggle = this.querySelector(selectors$e.shareDetails);
        this.shareButton = this.querySelector(selectors$e.shareButton);
        this.shareCopy = this.querySelector(selectors$e.shareCopy);
        this.shareSummary = this.querySelector(selectors$e.shareSummary);
        this.closeButton = this.querySelector(selectors$e.closeButton);
        this.successMessage = this.querySelector(selectors$e.successMessage);
        this.shareHolder = this.querySelector(selectors$e.shareHolder);
        this.urlInput = this.querySelector(selectors$e.urlInput);

        this.urlToShare = this.urlInput ? this.urlInput.value : document.location.href;

        this.init();
      }

      init() {
        if (navigator.share) {
          this.mainDetailsToggle.setAttribute('hidden', '');
          this.shareButton.classList.remove(classes$7.hidden);
          this.shareButton.addEventListener('click', () => {
            navigator.share({url: this.urlToShare, title: document.title});
          });
        } else {
          this.mainDetailsToggle.addEventListener('toggle', this.toggleDetails.bind(this));
          this.mainDetailsToggle.addEventListener('focusout', () => {
            setTimeout(() => {
              if (!this.contains(document.activeElement)) {
                this.close();
              }
            });
          });
          this.shareCopy.addEventListener('click', this.copyToClipboard.bind(this));
          this.closeButton.addEventListener('click', this.close.bind(this));
          this.container.addEventListener('keyup', this.keyboardEvents.bind(this));
        }
      }

      toggleDetails() {
        if (!this.mainDetailsToggle.open) {
          this.successMessage.classList.add(classes$7.hidden);
          this.successMessage.textContent = '';
          this.closeButton.classList.add(classes$7.hidden);
          this.shareCopy.focus();
        }
      }

      copyToClipboard() {
        navigator.clipboard.writeText(this.urlInput.value).then(() => {
          this.successMessage.classList.remove(classes$7.hidden);
          this.successMessage.textContent = theme.strings.successMessage;
          this.closeButton.classList.remove(classes$7.hidden);
          this.closeButton.focus();
        });
      }

      close() {
        this.mainDetailsToggle.removeAttribute('open');
        this.shareSummary.setAttribute('aria-expanded', false);
      }

      keyboardEvents(e) {
        if (e.which !== window.theme.keyboardKeys.ESCAPE) {
          return;
        }
        this.mainDetailsToggle.focus();
        this.close();
      }
    }

    const selectors$d = {
      dataVideoId: 'videoid',
      player: '[data-player]',
      dataEnableVideoLooping: 'data-enable-video-looping',
    };

    const classes$6 = {
      playBtn: 'lty-playbtn',
      visuallyHidden: 'lyt-visually-hidden',
      activated: 'lyt-activated',
    };

    class LiteYTEmbed extends HTMLElement {
      connectedCallback() {
        this.videoId = this.getAttribute(selectors$d.dataVideoId);

        let playBtnEl = this.querySelector(`.${classes$6.playBtn}`);
        // A label for the button takes priority over a [playlabel] attribute on the custom-element
        this.playLabel = (playBtnEl && playBtnEl.textContent.trim()) || this.getAttribute('playlabel') || 'Play';

        /**
         * Lo, the youtube placeholder image!  (aka the thumbnail, poster image, etc)
         *
         * See https://github.com/paulirish/lite-youtube-embed/blob/master/youtube-thumbnail-urls.md
         *
         * TODO: Do the sddefault->hqdefault fallback
         *       - When doing this, apply referrerpolicy (https://github.com/ampproject/amphtml/pull/3940)
         * TODO: Consider using webp if supported, falling back to jpg
         */
        if (!this.style.backgroundImage) {
          this.style.backgroundImage = `url("https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg")`;
        }

        // Set up play button, and its visually hidden label
        if (!playBtnEl) {
          playBtnEl = document.createElement('button');
          playBtnEl.type = 'button';
          playBtnEl.classList.add(classes$6.playBtn);
          this.append(playBtnEl);
        }
        if (!playBtnEl.textContent) {
          const playBtnLabelEl = document.createElement('span');
          playBtnLabelEl.className = classes$6.visuallyHidden;
          playBtnLabelEl.textContent = this.playLabel;
          playBtnEl.append(playBtnLabelEl);
        }

        // On hover (or tap), warm up the TCP connections we're (likely) about to use.
        this.addEventListener('pointerover', LiteYTEmbed.warmConnections, {once: true});

        // Once the user clicks, add the real iframe and drop our play button
        // TODO: In the future we could be like amp-youtube and silently swap in the iframe during idle time
        //   We'd want to only do this for in-viewport or near-viewport ones: https://github.com/ampproject/amphtml/pull/5003
        this.addEventListener('click', this.addIframe);
      }

      // // TODO: Support the the user changing the [videoid] attribute
      // attributeChangedCallback() {
      // }

      /**
       * Add a <link rel={preload | preconnect} ...> to the head
       */
      static addPrefetch(kind, url, as) {
        const linkEl = document.createElement('link');
        linkEl.rel = kind;
        linkEl.href = url;
        if (as) {
          linkEl.as = as;
        }
        document.head.append(linkEl);
      }

      /**
       * Begin pre-connecting to warm up the iframe load
       * Since the embed's network requests load within its iframe,
       *   preload/prefetch'ing them outside the iframe will only cause double-downloads.
       * So, the best we can do is warm up a few connections to origins that are in the critical path.
       *
       * Maybe `<link rel=preload as=document>` would work, but it's unsupported: http://crbug.com/593267
       * But TBH, I don't think it'll happen soon with Site Isolation and split caches adding serious complexity.
       */
      static warmConnections() {
        if (LiteYTEmbed.preconnected) return;

        // The iframe document and most of its subresources come right off youtube.com
        LiteYTEmbed.addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
        // The botguard script is fetched off from google.com
        LiteYTEmbed.addPrefetch('preconnect', 'https://www.google.com');

        // Not certain if these ad related domains are in the critical path. Could verify with domain-specific throttling.
        LiteYTEmbed.addPrefetch('preconnect', 'https://googleads.g.doubleclick.net');
        LiteYTEmbed.addPrefetch('preconnect', 'https://static.doubleclick.net');

        LiteYTEmbed.preconnected = true;
      }

      addIframe(e) {
        if (this.classList.contains(classes$6.activated)) return;
        e.preventDefault();
        this.classList.add(classes$6.activated);

        const parent = this.closest(selectors$d.player);
        if (parent) {
          const uniqueKey = parent.dataset.player;
          const loop = this.hasAttribute(selectors$d.dataEnableVideoLooping) ? this.getAttribute(selectors$d.dataEnableVideoLooping) === 'true' : false;
          embedYoutube(uniqueKey, {
            autoplay: true,
            playlist: this.videoId,
            loop: loop,
          });
        } else {
          const params = new URLSearchParams(this.getAttribute('params') || []);
          params.append('autoplay', '1');

          const iframeEl = document.createElement('iframe');
          iframeEl.width = 560;
          iframeEl.height = 315;
          // No encoding necessary as [title] is safe. https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#:~:text=Safe%20HTML%20Attributes%20include
          iframeEl.title = this.playLabel;
          iframeEl.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
          iframeEl.allowFullscreen = true;
          // AFAIK, the encoding here isn't necessary for XSS, but we'll do it only because this is a URL
          // https://stackoverflow.com/q/64959723/89484
          iframeEl.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${params.toString()}`;
          this.append(iframeEl);

          // Set focus for a11y
          iframeEl.focus();
        }
      }
    }

    const selectors$c = {
      elements: {
        scrollbar: 'data-scrollbar-slider',
        scrollbarArrowPrev: '[data-scrollbar-arrow-prev]',
        scrollbarArrowNext: '[data-scrollbar-arrow-next]',
      },
      classes: {
        hide: 'is-hidden',
      },
      times: {
        delay: 200,
      },
    };

    class NativeScrollbar {
      constructor(scrollbar) {
        this.scrollbar = scrollbar;

        this.arrowNext = this.scrollbar.parentNode.querySelector(selectors$c.elements.scrollbarArrowNext);
        this.arrowPrev = this.scrollbar.parentNode.querySelector(selectors$c.elements.scrollbarArrowPrev);

        this.init();
        this.resize();

        if (this.scrollbar.hasAttribute(selectors$c.elements.scrollbar)) {
          this.scrollToVisibleElement();
        }
      }

      init() {
        if (this.arrowNext && this.arrowPrev) {
          this.toggleNextArrow();

          this.events();
        }
      }

      resize() {
        document.addEventListener('theme:resize', () => {
          this.toggleNextArrow();
        });
      }

      events() {
        this.arrowNext.addEventListener('click', (event) => {
          event.preventDefault();

          this.goToNext();
        });

        this.arrowPrev.addEventListener('click', (event) => {
          event.preventDefault();

          this.goToPrev();
        });

        this.scrollbar.addEventListener('scroll', () => {
          this.togglePrevArrow();
          this.toggleNextArrow();
        });
      }

      goToNext() {
        const position = this.scrollbar.getBoundingClientRect().width / 2 + this.scrollbar.scrollLeft;

        this.move(position);

        this.arrowPrev.classList.remove(selectors$c.classes.hide);

        this.toggleNextArrow();
      }

      goToPrev() {
        const position = this.scrollbar.scrollLeft - this.scrollbar.getBoundingClientRect().width / 2;

        this.move(position);

        this.arrowNext.classList.remove(selectors$c.classes.hide);

        this.togglePrevArrow();
      }

      toggleNextArrow() {
        setTimeout(() => {
          this.arrowNext.classList.toggle(selectors$c.classes.hide, Math.round(this.scrollbar.scrollLeft + this.scrollbar.getBoundingClientRect().width + 1) >= this.scrollbar.scrollWidth);
        }, selectors$c.times.delay);
      }

      togglePrevArrow() {
        setTimeout(() => {
          this.arrowPrev.classList.toggle(selectors$c.classes.hide, this.scrollbar.scrollLeft <= 0);
        }, selectors$c.times.delay);
      }

      scrollToVisibleElement() {
        [].forEach.call(this.scrollbar.children, (element) => {
          element.addEventListener('click', (event) => {
            event.preventDefault();

            this.move(element.offsetLeft - element.clientWidth);
          });
        });
      }

      move(offsetLeft) {
        this.scrollbar.scrollTo({
          top: 0,
          left: offsetLeft,
          behavior: 'smooth',
        });
      }
    }

    const selectors$b = {
      body: 'body',
      dataRelatedSectionElem: '[data-related-section]',
      dataTabsHolder: '[data-tabs-holder]',
      dataTab: 'data-tab',
      dataTabIndex: 'data-tab-index',
      blockId: 'data-block-id',
      tabsLi: '.tabs > button',
      tabLink: '.tab-link',
      tabLinkRecent: '.tab-link__recent',
      tabContent: '.tab-content',
      scrollbarHolder: '[data-scrollbar]',
      scrollbarArrowPrev: '[data-scrollbar-arrow-prev]',
      scrollbarArrowNext: '[data-scrollbar-arrow-next]',
      focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    const classes$5 = {
      classCurrent: 'current',
      classHide: 'hide',
      classAlt: 'alt',
      focusEnabled: 'focus-enabled',
    };

    const sections$8 = {};

    class GlobalTabs {
      constructor(holder) {
        this.container = holder;
        this.body = document.querySelector(selectors$b.body);

        if (this.container) {
          this.scrollbarHolder = this.container.querySelectorAll(selectors$b.scrollbarHolder);

          this.init();

          // Init native scrollbar
          this.initNativeScrollbar();
        }
      }

      init() {
        const ctx = this.container;
        const tabsNavList = ctx.querySelectorAll(selectors$b.tabsLi);
        const firstTabLink = ctx.querySelector(`${selectors$b.tabLink}-0`);
        const firstTabContent = ctx.querySelector(`${selectors$b.tabContent}-0`);

        if (firstTabContent) {
          firstTabContent.classList.add(classes$5.classCurrent);
        }

        if (firstTabLink) {
          firstTabLink.classList.add(classes$5.classCurrent);
        }

        this.checkVisibleTabLinks();
        this.container.addEventListener('tabs:checkRecentTab', () => this.checkRecentTab());
        this.container.addEventListener('tabs:hideRelatedTab', () => this.hideRelatedTab());

        if (tabsNavList.length) {
          tabsNavList.forEach((element) => {
            const tabId = parseInt(element.getAttribute(selectors$b.dataTab));
            const tab = ctx.querySelector(`${selectors$b.tabContent}-${tabId}`);

            element.addEventListener('click', () => {
              this.tabChange(element, tab);
            });

            element.addEventListener('keyup', (event) => {
              if ((event.which === window.theme.keyboardKeys.SPACE || event.which === window.theme.keyboardKeys.ENTER) && this.body.classList.contains(classes$5.focusEnabled)) {
                this.tabChange(element, tab);

                if (tab.querySelector(selectors$b.focusable)) {
                  trapFocus(tab, {
                    elementToFocus: tab.querySelector(selectors$b.focusable),
                  });
                }
              }
            });

            tab.addEventListener('keyup', (event) => {
              if (event.which === window.theme.keyboardKeys.ESCAPE && this.body.classList.contains(classes$5.focusEnabled)) {
                removeTrapFocus();
                element.focus();
              }
            });
          });
        }
      }

      tabChange(element, tab) {
        this.container.querySelector(`${selectors$b.tabsLi}.${classes$5.classCurrent}`).classList.remove(classes$5.classCurrent);
        this.container.querySelector(`${selectors$b.tabContent}.${classes$5.classCurrent}`).classList.remove(classes$5.classCurrent);

        element.classList.add(classes$5.classCurrent);
        tab.classList.add(classes$5.classCurrent);

        if (element.classList.contains(classes$5.classHide)) {
          tab.classList.add(classes$5.classHide);
        }

        this.checkVisibleTabLinks();

        this.container.dispatchEvent(new CustomEvent('theme:tab:change'));

        this.container.dispatchEvent(
          new CustomEvent('theme:form:sticky', {
            bubbles: true,
            detail: {
              element: 'tab',
            },
          })
        );
      }

      initNativeScrollbar() {
        if (this.scrollbarHolder.length) {
          this.scrollbarHolder.forEach((scrollbar) => {
            new NativeScrollbar(scrollbar);
          });
        }
      }

      checkVisibleTabLinks() {
        const tabsNavList = this.container.querySelectorAll(selectors$b.tabsLi);
        const tabsNavListHided = this.container.querySelectorAll(`${selectors$b.tabLink}.${classes$5.classHide}`);
        const difference = tabsNavList.length - tabsNavListHided.length;

        if (difference < 2) {
          this.container.classList.add(classes$5.classAlt);
        } else {
          this.container.classList.remove(classes$5.classAlt);
        }
      }

      checkRecentTab() {
        const tabLink = this.container.querySelector(selectors$b.tabLinkRecent);

        if (tabLink) {
          tabLink.classList.remove(classes$5.classHide);
          const tabLinkIdx = parseInt(tabLink.getAttribute(selectors$b.dataTab));
          const tabContent = this.container.querySelector(`${selectors$b.tabContent}[${selectors$b.dataTabIndex}="${tabLinkIdx}"]`);

          if (tabContent) {
            tabContent.classList.remove(classes$5.classHide);
          }

          this.checkVisibleTabLinks();

          this.initNativeScrollbar();
        }
      }

      hideRelatedTab() {
        const relatedSection = this.container.querySelector(selectors$b.dataRelatedSectionElem);
        if (!relatedSection) {
          return;
        }

        const parentTabContent = relatedSection.closest(`${selectors$b.tabContent}.${classes$5.classCurrent}`);
        if (!parentTabContent) {
          return;
        }
        const parentTabContentIdx = parseInt(parentTabContent.getAttribute(selectors$b.dataTabIndex));
        const tabsNavList = this.container.querySelectorAll(selectors$b.tabsLi);

        if (tabsNavList.length > parentTabContentIdx) {
          const nextTabsNavLink = tabsNavList[parentTabContentIdx].nextSibling;

          if (nextTabsNavLink) {
            tabsNavList[parentTabContentIdx].classList.add(classes$5.classHide);
            nextTabsNavLink.dispatchEvent(new Event('click'));
            this.initNativeScrollbar();
          }
        }
      }

      onBlockSelect(evt) {
        const element = this.container.querySelector(`${selectors$b.tabLink}[${selectors$b.blockId}="${evt.detail.blockId}"]`);
        if (element) {
          element.dispatchEvent(new Event('click'));

          element.parentNode.scrollTo({
            top: 0,
            left: element.offsetLeft - element.clientWidth,
            behavior: 'smooth',
          });
        }
      }
    }

    const tabs = {
      onLoad() {
        sections$8[this.id] = [];
        const tabHolders = this.container.querySelectorAll(selectors$b.dataTabsHolder);

        tabHolders.forEach((holder) => {
          sections$8[this.id].push(new GlobalTabs(holder));
        });
      },
      onBlockSelect(e) {
        sections$8[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(e);
          }
        });
      },
    };

    const selectors$a = {
      productMediaJson: '[data-product-media-json]',
      popupButton: '[data-toggle-product-modal]',
      zoomButton: '[data-zoom-button]',
      toggleTruncateHolder: '[data-truncated-holder]',
      toggleTruncateButton: '[data-truncated-button]',
      toggleTruncateContent: '[data-truncated-content]',
      toggleTruncateContentAttr: 'data-truncated-content',
    };

    const classes$4 = {
      classExpanded: 'is-expanded',
      classVisible: 'is-visible',
    };

    const sections$7 = [];

    class ProductTemplate {
      constructor(section) {
        this.section = section;
        this.id = section.id;
        this.container = section.container;
        this.settings = section.settings;

        modal(this.id);
        this.media = new Media(section);

        const productMediaJSON = this.container.querySelector(selectors$a.productMediaJson);
        if (productMediaJSON && productMediaJSON.innerHTML !== '') {
          this.productMediaJson = JSON.parse(productMediaJSON.innerHTML);
        } else {
          console.error('Missing product JSON');
          return;
        }

        this.truncateElementHolder = this.container.querySelector(selectors$a.toggleTruncateHolder);
        this.truncateElement = this.container.querySelector(selectors$a.toggleTruncateContent);
        this.resizeEventTruncate = () => this.truncateText();

        this.init();
      }

      init() {
        this.zoomEnabled = this.container.querySelector(selectors$a.zoomButton) !== null;
        if (this.zoomEnabled) {
          productPhotoswipeZoom(this.container, this.productMediaJson);
        }

        if (this.truncateElementHolder && this.truncateElement) {
          setTimeout(this.resizeEventTruncate, 50);
          document.addEventListener('theme:resize', this.resizeEventTruncate);
        }
      }

      truncateText() {
        if (this.truncateElementHolder.classList.contains(classes$4.classVisible)) return;
        const styles = this.truncateElement.querySelectorAll('style');
        if (styles.length) {
          styles.forEach((style) => {
            this.truncateElementHolder.prepend(style);
          });
        }

        const truncateElementCloned = this.truncateElement.cloneNode(true);
        const truncateElementClass = this.truncateElement.getAttribute(selectors$a.toggleTruncateContentAttr);
        const truncateNextElement = this.truncateElement.nextElementSibling;
        if (truncateNextElement) {
          truncateNextElement.remove();
        }

        this.truncateElement.parentElement.append(truncateElementCloned);

        const truncateAppendedElement = this.truncateElement.nextElementSibling;
        truncateAppendedElement.classList.add(truncateElementClass);
        truncateAppendedElement.removeAttribute(selectors$a.toggleTruncateContentAttr);

        showElement(truncateAppendedElement);

        ellipsis(truncateAppendedElement, 5, {
          replaceStr: '',
          delimiter: ' ',
        });

        hideElement(truncateAppendedElement);

        if (this.truncateElement.innerHTML !== truncateAppendedElement.innerHTML) {
          this.truncateElementHolder.classList.add(classes$4.classExpanded);
        } else {
          truncateAppendedElement.remove();
          this.truncateElementHolder.classList.remove(classes$4.classExpanded);
        }

        this.toggleTruncatedContent(this.truncateElementHolder);
      }

      toggleTruncatedContent(holder) {
        const toggleButton = holder.querySelector(selectors$a.toggleTruncateButton);
        if (toggleButton) {
          toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            holder.classList.remove(classes$4.classExpanded);
            holder.classList.add(classes$4.classVisible);
          });
        }
      }

      onBlockSelect(event) {
        const block = this.container.querySelector(`[data-block-id="${event.detail.blockId}"]`);
        if (block) {
          block.dispatchEvent(new Event('click'));
        }
      }

      onBlockDeselect(event) {
        const block = this.container.querySelector(`[data-block-id="${event.detail.blockId}"]`);
        if (block) {
          block.dispatchEvent(new Event('click'));
        }
      }

      onUnload() {
        this.media.destroy();
        if (this.truncateElementHolder && this.truncateElement) {
          document.removeEventListener('theme:resize', this.resizeEventTruncate);
        }
      }
    }

    const productSection = {
      onLoad() {
        sections$7[this.id] = new ProductTemplate(this);
      },
      onUnload() {
        if (typeof sections$7[this.id].unload === 'function') {
          sections$7[this.id].unload();
        }
      },
      onBlockSelect(evt) {
        if (typeof sections$7[this.id].onBlockSelect === 'function') {
          sections$7[this.id].onBlockSelect(evt);
        }
      },
      onBlockDeselect(evt) {
        if (typeof sections$7[this.id].onBlockDeselect === 'function') {
          sections$7[this.id].onBlockDeselect(evt);
        }
      },
    };

    register('product', [productSection, productAddSection, productStickySection, accordion, tabs, swapperSection]);

    if (!customElements.get('pickup-availability')) {
      customElements.define('pickup-availability', PickupAvailability);
    }

    if (!customElements.get('product-complimentary')) {
      customElements.define('product-complimentary', ProductComplimentary);
    }

    if (!customElements.get('radio-swatch')) {
      customElements.define('radio-swatch', RadioSwatch);
    }

    if (!customElements.get('popout-select')) {
      customElements.define('popout-select', PopoutSelect);
    }

    if (!customElements.get('share-button')) {
      customElements.define('share-button', ShareButton);
    }

    if (!customElements.get('lite-youtube')) {
      customElements.define('lite-youtube', LiteYTEmbed);
    }

    const relatedSection = {
      onLoad: function () {
        const relatedSection = this.container;
        const parent = relatedSection.parentElement;
        const productId = this.container.getAttribute('data-product-id');
        const limit = this.container.getAttribute('data-limit');
        const sectionID = this.container.getAttribute('data-section-id');
        const route = window.theme.routes.product_recommendations_url || '/recommendations/products/';
        const requestUrl = `${route}?section_id=${sectionID}&limit=${limit}&product_id=${productId}`;
        parent.style.display = 'none';

        fetch(requestUrl)
          .then((response) => response.text())
          .then((response) => {
            const fresh = document.createElement('div');
            fresh.innerHTML = response;
            parent.innerHTML = fresh.querySelector('[data-related-section]').innerHTML;
            slideDown(parent);
            setTimeout(() => {
              new DefaultSlider(parent);
            }, 600);
          })
          .catch((error) => console.log(error));
      },
    };

    register('related', relatedSection);

    register('reviews', [slider, blockScroll]);

    const selectors$9 = {
      button: '[data-scroll-down]',
    };

    class ScrollButton {
      constructor(el) {
        this.wrapper = el;
        this.init();
      }

      init() {
        const buttons = this.wrapper.querySelectorAll(selectors$9.button);
        if (buttons) {
          buttons.forEach((btn) => {
            btn.addEventListener('click', this.scroll.bind(this));
          });
        }
      }

      scroll() {
        const bottom = this.wrapper.offsetTop + this.wrapper.clientHeight;
        window.scroll({
          top: bottom,
          left: 0,
          behavior: 'smooth',
        });
      }
    }

    const scrollButton = {
      onLoad() {
        this.scrollButton = new ScrollButton(this.container);
      },
      onUnload: function () {
        delete this.scrollButton;
      },
    };

    const sections$6 = [];
    const selectors$8 = {
      wrapper: '[data-slideshow-wrapper]',
      speed: 'data-slideshow-speed',
      autoplay: 'data-slideshow-autoplay',
      slideCount: 'data-slideshow-slides',
      prevButton: '[slide-custom-prev]',
      nextButton: '[slide-custom-next]',
      flickityDisableClass: 'flickity-disabled-mobile',
      flickityEnabled: 'flickity-enabled',
    };

    class Slideshow {
      constructor(section) {
        this.container = section.container;
        this.wrapper = this.container.querySelector(selectors$8.wrapper);
        this.speed = this.wrapper.getAttribute(selectors$8.speed);
        this.autoplay = this.wrapper.getAttribute(selectors$8.autoplay) === 'true';
        this.slideCount = parseInt(this.wrapper.getAttribute(selectors$8.slideCount), 10);
        this.prevButtons = this.wrapper.querySelectorAll(selectors$8.prevButton);
        this.nextButtons = this.wrapper.querySelectorAll(selectors$8.nextButton);
        this.flkty = null;
        this.scrollEvent = () => this.scrollEvents();
        this.resizeEvent = () => this.resizeEvents();
        this.init();
      }

      init() {
        const settings = {
          autoPlay: this.autoplay && this.speed ? parseInt(this.speed) : false,
          contain: false,
          pageDots: true,
          adaptiveHeight: true,
          accessibility: true,
          wrapAround: this.slideCount !== 2,
          prevNextButtons: false,
          draggable: true,
          fade: true,
          watchCSS: true,
        };
        this.flkty = new FlickityFade(this.wrapper, settings);

        if (this.prevButtons.length) {
          this.prevButtons.forEach((e) => {
            e.onclick = () => {
              this.flkty.previous(true, false);
            };
          });
        }
        if (this.nextButtons.length) {
          this.nextButtons.forEach((e) => {
            e.onclick = () => {
              this.flkty.next(true, false);
            };
          });
        }

        this.stopSlider();

        document.addEventListener('theme:resize', this.resizeEvent);
        document.addEventListener('theme:scroll', this.scrollEvent);
      }

      scrollEvents() {
        if (this.flkty && this.autoplay && this.speed) {
          const slideshow = this.flkty.element;
          const slideshowBottomPosition = slideshow.getBoundingClientRect().top + window.scrollY + slideshow.offsetHeight;
          if (window.pageYOffset > slideshowBottomPosition) {
            if (this.flkty.player.state === 'playing') {
              this.flkty.pausePlayer();
            }
          } else if (this.flkty.player.state === 'paused') {
            this.flkty.playPlayer();
          }
        }
      }

      resizeEvents() {
        this.stopSlider();
      }

      stopSlider() {
        if (window.innerWidth < window.theme.sizes.medium && this.wrapper?.classList.contains(selectors$8.flickityDisableClass)) {
          new CustomScrollbar(this.container);
        }
      }

      unload() {
        document.removeEventListener('theme:resize', this.resizeEvent);
        document.removeEventListener('theme:scroll', this.scrollEvent);
        if (this.flkty) {
          this.flkty.destroy();
        }
      }

      onBlockSelect(evt) {
        const indexEl = evt.target.closest('[data-slideshow-index]');
        const slideIndex = indexEl.getAttribute('data-slideshow-index');
        const select = parseInt(slideIndex, 10);
        if (this.flkty && this.flkty.element && this.flkty.element.classList.contains(selectors$8.flickityEnabled)) {
          this.flkty.selectCell(select);
          this.flkty.pausePlayer();
        }
      }

      onBlockDeselect() {
        if (this.autoplay) {
          this.flkty.unpausePlayer();
        }
      }
    }

    const slideshowSection = {
      onLoad() {
        sections$6[this.id] = new Slideshow(this);
      },
      onUnload() {
        if (typeof sections$6[this.id].unload === 'function') {
          sections$6[this.id].unload();
        }
      },
      onBlockSelect(evt) {
        if (typeof sections$6[this.id].onBlockSelect === 'function') {
          sections$6[this.id].onBlockSelect(evt);
        }
      },
      onBlockDeselect(evt) {
        if (typeof sections$6[this.id].onBlockSelect === 'function') {
          sections$6[this.id].onBlockDeselect(evt);
        }
      },
    };

    register('slideshow', [slideshowSection, scrollButton, blockScroll]);

    register('team', [slider, blockScroll]);

    var styles = {};
    styles.basic = [];
    /* eslint-disable */
    styles.light = [
      {featureType: 'administrative', elementType: 'labels', stylers: [{visibility: 'on'}, {lightness: '64'}, {hue: '#ff0000'}]},
      {featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{color: '#bdbdbd'}]},
      {featureType: 'administrative', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'landscape', elementType: 'all', stylers: [{color: '#f0f0f0'}, {visibility: 'simplified'}]},
      {featureType: 'landscape.natural.landcover', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'landscape.natural.terrain', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'geometry.fill', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'labels', stylers: [{lightness: '100'}]},
      {featureType: 'poi.park', elementType: 'all', stylers: [{visibility: 'on'}]},
      {featureType: 'poi.park', elementType: 'geometry', stylers: [{saturation: '-41'}, {color: '#e8ede7'}]},
      {featureType: 'poi.park', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road', elementType: 'all', stylers: [{saturation: '-100'}]},
      {featureType: 'road', elementType: 'labels', stylers: [{lightness: '25'}, {gamma: '1.06'}, {saturation: '-100'}]},
      {featureType: 'road.highway', elementType: 'all', stylers: [{visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{gamma: '10.00'}]},
      {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}, {visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{weight: '0.01'}]},
      {featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{weight: '0.8'}]},
      {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'road.local', elementType: 'geometry.fill', stylers: [{weight: '0.01'}]},
      {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{gamma: '10.00'}, {lightness: '100'}, {weight: '0.4'}]},
      {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'simplified'}, {weight: '0.01'}, {lightness: '39'}]},
      {featureType: 'road.local', elementType: 'labels.text.stroke', stylers: [{weight: '0.50'}, {gamma: '10.00'}, {lightness: '100'}]},
      {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'water', elementType: 'all', stylers: [{color: '#cfe5ee'}, {visibility: 'on'}]},
    ];

    styles.light_blank = [
      {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'administrative', elementType: 'labels', stylers: [{visibility: 'off'}, {lightness: '64'}, {hue: '#ff0000'}]},
      {featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{color: '#bdbdbd'}]},
      {featureType: 'administrative', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'landscape', elementType: 'all', stylers: [{color: '#f0f0f0'}, {visibility: 'simplified'}]},
      {featureType: 'landscape.natural.landcover', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'landscape.natural.terrain', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'geometry.fill', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'labels', stylers: [{lightness: '100'}]},
      {featureType: 'poi.park', elementType: 'all', stylers: [{visibility: 'on'}]},
      {featureType: 'poi.park', elementType: 'geometry', stylers: [{saturation: '-41'}, {color: '#e8ede7'}]},
      {featureType: 'poi.park', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road', elementType: 'all', stylers: [{saturation: '-100'}]},
      {featureType: 'road', elementType: 'labels', stylers: [{lightness: '25'}, {gamma: '1.06'}, {saturation: '-100'}, {visibility: 'off'}]},
      {featureType: 'road.highway', elementType: 'all', stylers: [{visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{gamma: '10.00'}]},
      {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}, {visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{weight: '0.01'}]},
      {featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{weight: '0.8'}]},
      {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'road.local', elementType: 'geometry.fill', stylers: [{weight: '0.01'}]},
      {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{gamma: '10.00'}, {lightness: '100'}, {weight: '0.4'}]},
      {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'off'}, {weight: '0.01'}, {lightness: '39'}]},
      {featureType: 'road.local', elementType: 'labels.text.stroke', stylers: [{weight: '0.50'}, {gamma: '10.00'}, {lightness: '100'}]},
      {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'water', elementType: 'all', stylers: [{color: '#cfe5ee'}, {visibility: 'on'}]},
    ];

    styles.white_blank = [
      {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{color: '#444444'}]},
      {featureType: 'landscape', elementType: 'all', stylers: [{color: '#f2f2f2'}]},
      {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'road', elementType: 'all', stylers: [{saturation: -100}, {lightness: 45}]},
      {featureType: 'road.highway', elementType: 'all', stylers: [{visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0'}]},
      {featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'water', elementType: 'all', stylers: [{color: '#e4e4e4'}, {visibility: 'on'}]},
    ];

    styles.white_label = [
      {featureType: 'all', elementType: 'all', stylers: [{visibility: 'simplified'}]},
      {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'simplified'}]},
      {featureType: 'administrative', elementType: 'labels', stylers: [{gamma: '3.86'}, {lightness: '100'}]},
      {featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{color: '#cccccc'}]},
      {featureType: 'landscape', elementType: 'all', stylers: [{color: '#f2f2f2'}]},
      {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'road', elementType: 'all', stylers: [{saturation: -100}, {lightness: 45}]},
      {featureType: 'road.highway', elementType: 'all', stylers: [{visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0'}]},
      {featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.local', elementType: 'labels.text', stylers: [{visibility: 'off'}]},
      {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'water', elementType: 'all', stylers: [{color: '#e4e4e4'}, {visibility: 'on'}]},
    ];

    styles.dark_blank = [
      {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'all', elementType: 'labels.text.fill', stylers: [{saturation: 36}, {color: '#000000'}, {lightness: 40}]},
      {featureType: 'all', elementType: 'labels.text.stroke', stylers: [{visibility: 'on'}, {color: '#000000'}, {lightness: 16}]},
      {featureType: 'all', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'administrative', elementType: 'geometry.fill', stylers: [{color: '#000000'}, {lightness: 20}]},
      {featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {lightness: 17}, {weight: 1.2}]},
      {featureType: 'administrative', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'landscape', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 20}]},
      {featureType: 'landscape', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 21}]},
      {featureType: 'road', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{color: '#000000'}, {lightness: 17}, {weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {lightness: 29}, {weight: '0.01'}]},
      {featureType: 'road.arterial', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 18}]},
      {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.local', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 16}]},
      {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'transit', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 19}]},
      {featureType: 'water', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 17}]},
    ];

    styles.dark_label = [
      {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'all', elementType: 'labels.text.fill', stylers: [{saturation: 36}, {color: '#000000'}, {lightness: 40}]},
      {featureType: 'all', elementType: 'labels.text.stroke', stylers: [{visibility: 'on'}, {color: '#000000'}, {lightness: 16}]},
      {featureType: 'all', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
      {featureType: 'administrative', elementType: 'geometry.fill', stylers: [{color: '#000000'}, {lightness: 20}]},
      {featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {lightness: 17}, {weight: 1.2}]},
      {featureType: 'administrative', elementType: 'labels', stylers: [{visibility: 'simplified'}, {lightness: '-82'}]},
      {featureType: 'administrative', elementType: 'labels.text.stroke', stylers: [{invert_lightness: true}, {weight: '7.15'}]},
      {featureType: 'landscape', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 20}]},
      {featureType: 'landscape', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'poi', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 21}]},
      {featureType: 'road', elementType: 'labels', stylers: [{visibility: 'simplified'}]},
      {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{color: '#000000'}, {lightness: 17}, {weight: '0.8'}]},
      {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {lightness: 29}, {weight: '0.01'}]},
      {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'road.arterial', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 18}]},
      {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.local', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 16}]},
      {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
      {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'off'}]},
      {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
      {featureType: 'transit', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 19}]},
      {featureType: 'water', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 17}]},
    ];
    /* eslint-enable */

    function mapStyle(key) {
      return styles[key];
    }

    window.theme.allMaps = window.theme.allMaps || {};
    let allMaps = window.theme.allMaps;

    class Map$1 {
      constructor(section) {
        this.container = section.container;
        this.mapWrap = this.container.querySelector('[data-map-container]');
        this.styleString = this.container.getAttribute('data-style') || '';
        this.key = this.container.getAttribute('data-api-key');
        this.zoomString = this.container.getAttribute('data-zoom') || 14;
        this.address = this.container.getAttribute('data-address');
        this.enableCorrection = this.container.getAttribute('data-latlong-correction');
        this.lat = this.container.getAttribute('data-lat');
        this.long = this.container.getAttribute('data-long');
        if (this.key) {
          this.initMaps();
        }
      }

      initMaps() {
        const urlKey = `https://maps.googleapis.com/maps/api/js?key=${this.key}`;
        loadScript$1({url: urlKey})
          .then(() => {
            return this.enableCorrection === 'true' && this.lat !== '' && this.long !== '' ? new window.google.maps.LatLng(this.lat, this.long) : geocodeAddressPromise(this.address);
          })
          .then((center) => {
            var zoom = parseInt(this.zoomString, 10);
            const styles = mapStyle(this.styleString);
            var mapOptions = {
              zoom,
              styles,
              center,
              draggable: true,
              clickableIcons: false,
              scrollwheel: false,
              zoomControl: false,
              disableDefaultUI: true,
            };
            const map = createMap(this.mapWrap, mapOptions);
            return map;
          })
          .then((map) => {
            this.map = map;
            allMaps[this.id] = map;
          })
          .catch((e) => {
            console.log('Failed to load Google Map');
            console.log(e);
          });
      }

      onUnload() {
        if (typeof window.google !== 'undefined') {
          window.google.maps.event.clearListeners(this.map, 'resize');
        }
      }
    }

    function createMap(container, options) {
      var map = new window.google.maps.Map(container, options);
      var center = map.getCenter();

      new window.google.maps.Marker({
        map: map,
        position: center,
      });

      window.google.maps.event.addDomListener(window, 'resize', function () {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      });
      return map;
    }

    function geocodeAddressPromise(address) {
      return new Promise((resolve, reject) => {
        var geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({address: address}, function (results, status) {
          if (status == 'OK') {
            var latLong = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            };
            resolve(latLong);
          } else {
            reject(status);
          }
        });
      });
    }

    const mapSection = {
      onLoad() {
        allMaps[this.id] = new Map$1(this);
      },
      onUnload() {
        if (typeof allMaps[this.id].unload === 'function') {
          allMaps[this.id].unload();
        }
      },
    };

    register('section-map', mapSection);

    register('hero', [parallaxImage, scrollButton]);

    register('video', [scrollButton, popupVideoSection]);

    const selectors$7 = {
      videoButton: '[data-video-button]',
      backgroundVideo: '[data-background-video]',
      attrUnique: 'data-unique',
      attrVideoId: 'data-video-id',
      attrVideoType: 'data-video-type',
      attrVideoAutoplay: 'data-video-autoplay',
      attrLoop: 'data-video-loop',
      playerWrapper: '[data-player]',
      dataSectionVideoOnload: 'data-section-video-onload',
    };

    const classes$3 = {
      isLoaded: 'is-loaded',
    };

    let sections$5 = {};

    class VideoAPIPlayer {
      constructor(section) {
        this.container = section.container;
        this.videoOnLoad = this.container.hasAttribute(selectors$7.dataSectionVideoOnload);
        this.triggers = this.container.querySelectorAll(selectors$7.videoButton);
        this.backgroundVideo = this.container.querySelector(selectors$7.backgroundVideo);
        this.button = null;
        this.unique = null;
        this.video = null;
        this.type = null;
        this.autoplay = true;
        this.loop = true;
        this.loadedVideoPlayer = null;

        this.init();
      }

      init() {
        if (this.triggers.length) {
          this.button = this.triggers[0];

          if (this.videoOnLoad) {
            this.loadVideos();
          } else {
            this.triggers.forEach((trigger) => {
              trigger.addEventListener('click', (event) => this.loadVideos(event));
            });
          }
        }
      }

      loadVideos(event) {
        if (event && event.currentTarget) {
          this.button = event.currentTarget;
        }

        if (this.button) {
          this.unique = this.button.hasAttribute(selectors$7.attrUnique) ? this.button.getAttribute(selectors$7.attrUnique) : null;
          this.video = this.button.hasAttribute(selectors$7.attrVideoId) ? this.button.getAttribute(selectors$7.attrVideoId) : null;
          this.type = this.button.hasAttribute(selectors$7.attrVideoType) ? this.button.getAttribute(selectors$7.attrVideoType) : null;
          this.autoplay = this.button.hasAttribute(selectors$7.attrVideoAutoplay) ? this.button.getAttribute(selectors$7.attrVideoAutoplay) !== 'false' : true;
          this.loop = this.button.hasAttribute(selectors$7.attrLoop) ? this.button.getAttribute(selectors$7.attrLoop) !== 'false' : true;
        }

        if (this.unique && this.video && this.type) {
          const uniqueKey = `${this.video}-${this.unique}`;

          if (this.type === 'vimeo') {
            if (this.loadedVideoPlayer) {
              this.loadedVideoPlayer.play();
              this.scrollToVideo(this.loadedVideoPlayer.element);
            } else {
              embedVimeo(uniqueKey, {
                autoplay: this.autoplay,
                background: false,
                loop: this.loop,
                controls: true,
                muted: true,
                playsinline: true,
              })
                .then((player) => {
                  return this.vimeoBackground(player);
                })
                .catch((err) => {
                  console.error(err);
                });
            }
          }

          if (this.type === 'youtube') {
            if (this.loadedVideoPlayer) {
              this.loadedVideoPlayer.playVideo();
              this.scrollToVideo(this.loadedVideoPlayer.getIframe());
            } else {
              embedYoutube(uniqueKey, {
                autoplay: this.autoplay,
                cc_load_policy: 0,
                iv_load_policy: 0,
                modestbranding: 1,
                playsinline: 1,
                fs: 0,
                controls: 1,
                mute: 1,
              })
                .then((player) => {
                  return this.youtubeBackground(player);
                })
                .catch((err) => {
                  console.error(err);
                });
            }
          }
        }
      }

      youtubeBackground(player) {
        this.loadedVideoPlayer = player;

        this.scrollToVideo(player.getIframe());

        player.addEventListener('onStateChange', (event) => {
          if (event.data === 0) {
            if (this.loop) {
              event.target.playVideo();
            } else {
              this.videoLoadedToggle(true);
              this.nativeVideoEvents(true);
            }
          }

          if (event.data === 1) {
            event.target.mute();
            event.target.playVideo();
            this.nativeVideoEvents();
            this.videoLoadedToggle();
          }
        });

        return player;
      }

      vimeoBackground(player) {
        this.loadedVideoPlayer = player;

        this.scrollToVideo(player.element);

        player.on('play', () => {
          this.nativeVideoEvents();
          this.videoLoadedToggle();
        });

        player.on('ended', () => {
          this.nativeVideoEvents(true);
          this.videoLoadedToggle(true);
        });

        return player;
      }

      videoLoadedToggle(videoStop = false) {
        this.container.classList.toggle(classes$3.isLoaded, !videoStop);
      }

      nativeVideoEvents(play = false) {
        if (this.backgroundVideo && typeof this.backgroundVideo.pause === 'function') {
          if (play) {
            this.backgroundVideo.play();
          } else {
            this.backgroundVideo.pause();
          }
        }
      }

      scrollToVideo(element) {
        const playerParent = element.closest(selectors$7.playerWrapper);
        if (!this.videoOnLoad && playerParent) {
          const pageTop = window.pageYOffset;
          const pageBottom = pageTop + window.innerHeight;
          const playerParentPosition = playerParent.getBoundingClientRect().top + window.scrollY;
          const playerParentBottomPosition = playerParentPosition + playerParent.offsetHeight;
          if (pageTop > playerParentPosition || pageBottom < playerParentBottomPosition) {
            window.scroll({
              top: playerParentPosition,
              left: 0,
              behavior: 'smooth',
            });
          }
        }
      }
    }

    const videoSection = {
      onLoad() {
        sections$5[this.id] = new VideoAPIPlayer(this);
      },
      onUnload() {
        if (typeof sections$5[this.id].unload === 'function') {
          sections$5[this.id].unload();
        }
      },
    };

    register('video-player', videoSection);

    const selectors$6 = {
      trigger: '[data-toggle-password-modal]',
      errors: '.storefront-password-form .errors',
    };

    const sections$4 = {};

    class PasswordPage {
      constructor(section) {
        this.container = section.container;

        this.trigger = this.container.querySelector(selectors$6.trigger);
        this.errors = this.container.querySelector(selectors$6.errors);

        this.init();
      }

      init() {
        modal('password');
        if (this.errors) {
          this.trigger.click();
        }
      }
    }

    const passwordSection = {
      onLoad() {
        sections$4[this.id] = new PasswordPage(this);
      },
    };

    register('password', passwordSection);

    const selectors$5 = {
      zoomImage: '[data-image-zoom]',
      attrUnique: 'data-unique',
    };

    class GalleryZoom {
      constructor(container) {
        this.triggers = container.querySelectorAll(selectors$5.zoomImage);
        this.init();
      }

      init() {
        this.triggers.forEach((trigger) => {
          const unique = trigger.getAttribute(selectors$5.attrUnique);

          MicroModal.init({
            disableScroll: true,
            openTrigger: `data-popup-${unique}`,
            onShow: (modal) => {
              var images = modal.querySelectorAll('[data-src]', modal);
              images.forEach((image) => {
                if (image.getAttribute('src') === null) {
                  const bigImage = image.getAttribute('data-src');
                  image.setAttribute('src', bigImage);
                }
              });
            },
            onClose: (modal, el, event) => {
              event.preventDefault();
            },
          });
        });
      }
    }

    const galleryZoomSection = {
      onLoad() {
        new GalleryZoom(this.container);
      },
    };

    register('gallery', [galleryZoomSection, popupVideoSection, customScrollbar, blockScroll]);

    const cookieDefaultValues = {
      expires: 7,
      path: '/',
      domain: window.location.hostname,
    };

    class Cookies {
      constructor(options = {}) {
        this.options = {
          ...cookieDefaultValues,
          ...options,
        };
      }

      /**
       * Write cookie
       * @param value - String
       */
      write(value) {
        document.cookie = `${this.options.name}=${value}; expires=${this.options.expires}; path=${this.options.path}; domain=${this.options.domain}`;
      }

      /**
       * Read cookies and returns an array of values
       * @returns Array
       */
      read() {
        let cookieValuesArr = [];
        const hasCookieWithThisName = document.cookie.split('; ').find((row) => row.startsWith(this.options.name));

        if (document.cookie.indexOf('; ') !== -1 && hasCookieWithThisName) {
          const cookieValue = document.cookie
            .split('; ')
            .find((row) => row.startsWith(this.options.name))
            .split('=')[1];

          if (cookieValue !== null) {
            cookieValuesArr = cookieValue.split(',');
          }
        }

        return cookieValuesArr;
      }

      destroy() {
        document.cookie = `${this.options.name}=null; expires=${this.options.expires}; path=${this.options.path}; domain=${this.options.domain}`;
      }

      remove(removedValue) {
        const cookieValue = this.read();
        const position = cookieValue.indexOf(removedValue);

        if (position !== -1) {
          cookieValue.splice(position, 1);
          this.write(cookieValue);
        }
      }
    }

    const config = {
      howManyToShow: 4,
      howManyToStoreInMemory: 10,
      wrapper: '[data-recently-viewed-products]',
      limit: 'data-limit',
      recentWrapper: '[data-recent-wrapper]',
      apiContent: '[data-api-content]',
      productClasses: 'data-product-class',
      dataMinimum: 'data-minimum',
      hideClass: 'hide',
    };

    const cookieConfig = {
      expires: 90,
      name: 'shopify_recently_viewed',
    };

    const sections$3 = [];
    const excludedHandles = [];

    class RecentProducts {
      constructor(section) {
        this.container = section.container;
        this.cookie = new Cookies(cookieConfig);
        this.wrapper = this.container.querySelector(config.wrapper);
        this.slider = null;

        if (this.wrapper === null) {
          return;
        }

        this.howManyToShow = parseInt(this.container.querySelector(config.recentWrapper).getAttribute(config.limit)) || config.howManyToShow;
        this.minimum = parseInt(this.container.querySelector(config.recentWrapper).getAttribute(config.dataMinimum));
        this.classes = this.container.querySelector(config.recentWrapper).getAttribute(config.productClasses).split(' ');

        this.renderProducts();
      }

      renderProducts() {
        const recentlyViewedHandlesArray = this.cookie.read();
        const arrayURLs = [];
        let counter = 0;

        if (recentlyViewedHandlesArray.length > 0) {
          for (let index = 0; index < recentlyViewedHandlesArray.length; index++) {
            const handle = recentlyViewedHandlesArray[index];

            if (excludedHandles.includes(handle)) {
              continue;
            }

            const url = `${window.theme.routes.root_url}products/${handle}?section_id=api-product-grid-item`;

            arrayURLs.push(url);

            counter++;

            if (counter === this.howManyToShow || counter === recentlyViewedHandlesArray.length - 1) {
              break;
            }
          }

          if (arrayURLs.length > 0 && arrayURLs.length >= this.minimum) {
            this.container.classList.remove(config.hideClass);

            const fecthRequests = arrayURLs.map((url) => fetch(url, {mode: 'no-cors'}).then(this.handleErrors));
            this.productMarkups = [];

            Promise.allSettled(fecthRequests)
              .then((responses) => {
                return Promise.all(
                  responses.map(async (response) => {
                    if (response.status === 'fulfilled') {
                      this.productMarkups.push(await response.value.text());
                    }
                  })
                );
              })
              .then(() => {
                this.productMarkups.forEach((markup) => {
                  const buffer = document.createElement('div');

                  buffer.innerHTML = markup;

                  this.wrapper.innerHTML += buffer.querySelector(config.apiContent).innerHTML;
                });
              })
              .then(() => {
                showElement(this.wrapper, true);

                this.slider = new DefaultSlider(this.container);
              });
          }
        }
      }

      handleErrors(response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              text: text,
            });
            throw e;
          });
        }
        return response;
      }

      unload() {
        if (this.slider && typeof this.slider.unload === 'function') {
          this.slider.unload();
        }
      }
    }

    class RecordRecentlyViewed {
      constructor(handle) {
        this.handle = handle;
        this.cookie = new Cookies(cookieConfig);

        if (typeof this.handle === 'undefined') {
          return;
        }

        excludedHandles.push(this.handle);

        this.updateCookie();
      }

      updateCookie() {
        let recentlyViewed = this.cookie.read();

        // In what position is that product in memory.
        const position = recentlyViewed.indexOf(this.handle);

        // If not in memory.
        if (position === -1) {
          // Add product at the start of the list.
          recentlyViewed.unshift(this.handle);
          // Only keep what we need.
          recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
        } else {
          // Remove the product and place it at start of list.
          recentlyViewed.splice(position, 1);
          recentlyViewed.unshift(this.handle);
        }

        // Update cookie.
        this.cookie.write(recentlyViewed);
      }
    }

    const recentProducts = {
      onLoad() {
        sections$3[this.id] = new RecentProducts(this);
      },
      onUnload() {
        if (typeof sections$3[this.id].unload === 'function') {
          sections$3[this.id].unload();
        }
      },
    };

    register('recent-products', recentProducts);

    const selectors$4 = {
      ajaxDisable: 'data-ajax-disable',
      shipping: '[data-shipping-estimate-form]',
      input: '[data-update-cart]',
      update: '[data-update-button]',
      bottom: '[data-cart-bottom]',
      upsellProduct: '[data-upsell-holder]',
      upsellButton: '[data-add-action-wrapper]',
    };

    const cartSection = {
      onLoad() {
        this.disabled = this.container.getAttribute(selectors$4.ajaxDisable) == 'true';

        const hasShipping = this.container.querySelector(selectors$4.shipping);
        if (hasShipping) {
          new ShippingCalculator(this);
        }

        if (this.disabled) {
          this.cart = new DiabledCart(this);
          return;
        }

        this.cart = new CartItems(this);
        const initPromise = this.cart.init();
        initPromise.then(() => {
          this.cart.loadHTML();
        });
      },
    };

    class DiabledCart {
      constructor(section) {
        this.section = section;
        this.container = section.container;
        this.inputs = this.container.querySelectorAll(selectors$4.input);
        this.quantityWrappers = this.container.querySelectorAll(selectors$4.qty);
        this.updateBtn = this.container.querySelector(selectors$4.update);
        this.upsellProduct = this.container.querySelector(selectors$4.upsellProduct);

        this.initQuantity();
        this.initInputs();
        if (this.upsellProduct) {
          this.moveUpsell();
        }
      }

      initQuantity() {
        initQtySection(this.container);
      }

      moveUpsell() {
        const bottom = this.container.querySelector(selectors$4.bottom);
        bottom.insertBefore(this.upsellProduct, bottom.firstChild);

        const isCartItem = true;
        // Has only default variant
        new ProductAddButton(this.upsellProduct, isCartItem);
      }

      initInputs() {
        this.inputs.forEach((input) => {
          input.addEventListener(
            'change',
            function () {
              this.updateBtn.classList.add('cart--dirty');
              this.updateBtn.classList.add('heartBeat');
              setTimeout(
                function () {
                  this.updateBtn.classList.remove('heartBeat');
                }.bind(this),
                1300
              );
            }.bind(this)
          );
        });
      }
    }

    register('cart', [cartSection, accordion]);

    register('search-page', [sort, collectionFiltersSidebar, collectionFiltersForm, accordion]);

    if (!customElements.get('popout-select')) {
      customElements.define('popout-select', PopoutSelect);
    }

    register('section-collection-grid', [slider, blockScroll]);

    register('tabs', tabs);

    register('section-blog', slider);

    register('columns', [slider, blockScroll]);

    const fadeIn = (el, display, callback = null) => {
      el.style.opacity = 0;
      el.style.display = display || 'block';

      (function fade() {
        let val = parseFloat(el.style.opacity);
        if (!((val += 0.1) > 1)) {
          el.style.opacity = val;
          requestAnimationFrame(fade);
        }

        if (val === 1 && typeof callback === 'function') {
          callback();
        }
      })();
    };

    const fadeOut = (el, callback = null) => {
      el.style.opacity = 1;

      (function fade() {
        if ((el.style.opacity -= 0.1) < 0) {
          el.style.display = 'none';
        } else {
          requestAnimationFrame(fade);
        }

        if (parseFloat(el.style.opacity) === 0 && typeof callback === 'function') {
          callback();
        }
      })();
    };

    const selectors$3 = {
      newsletterForm: '[data-newsletter-form]',
    };

    const classes$2 = {
      success: 'has-success',
      error: 'has-error',
    };

    const sections$2 = {};

    class NewsletterCheckForResult {
      constructor(newsletter) {
        this.sessionStorage = window.sessionStorage;
        this.newsletter = newsletter;

        this.stopSubmit = true;
        this.isChallengePage = false;
        this.formID = null;

        this.checkForChallengePage();

        this.newsletterSubmit = (e) => this.newsletterSubmitEvent(e);

        if (!this.isChallengePage) {
          this.init();
        }
      }

      init() {
        this.newsletter.addEventListener('submit', this.newsletterSubmit);

        this.showMessage();
      }

      newsletterSubmitEvent(e) {
        if (this.stopSubmit) {
          e.preventDefault();

          this.removeStorage();
          this.writeStorage();
          this.stopSubmit = false;
          this.newsletter.submit();
        }
      }

      checkForChallengePage() {
        this.isChallengePage = window.location.pathname === '/challenge';
      }

      writeStorage() {
        if (this.sessionStorage !== undefined) {
          this.sessionStorage.setItem('newsletter_form_id', this.newsletter.id);
        }
      }

      readStorage() {
        this.formID = this.sessionStorage.getItem('newsletter_form_id');
      }

      removeStorage() {
        this.sessionStorage.removeItem('newsletter_form_id');
      }

      showMessage() {
        this.readStorage();

        if (this.newsletter.id === this.formID) {
          const newsletter = document.getElementById(this.formID);

          if (window.location.search.indexOf('?customer_posted=true') !== -1) {
            newsletter.classList.remove(classes$2.error);
            newsletter.classList.add(classes$2.success);
          } else if (window.location.search.indexOf('accepts_marketing') !== -1) {
            newsletter.classList.remove(classes$2.success);
            newsletter.classList.add(classes$2.error);
          }

          // Prevents the form from scrolling subsequent pagloads
          this.removeStorage();

          this.scrollToForm(newsletter);
        }
      }

      scrollToForm(newsletter) {
        const rect = newsletter.getBoundingClientRect();
        const isVisible =
          rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!isVisible) {
          setTimeout(() => {
            window.scroll({
              top: rect.top,
              left: 0,
              behavior: 'smooth',
            });
          }, 400);
        }
      }

      unload() {
        this.newsletter.removeEventListener('submit', this.newsletterSubmit);
      }
    }

    const newsletterCheckForResultSection = {
      onLoad() {
        sections$2[this.id] = [];
        const newsletters = this.container.querySelectorAll(selectors$3.newsletterForm);
        newsletters.forEach((form) => {
          sections$2[this.id].push(new NewsletterCheckForResult(form));
        });
      },
      onUnload() {
        sections$2[this.id].forEach((form) => {
          if (typeof form.unload === 'function') {
            form.unload();
          }
        });
      },
    };

    const selectors$2 = {
      tracking: '[data-tracking-consent]',
      trackingAccept: '[data-confirm-cookies]',
      close: '[data-close-modal]',
      popupInner: '[data-popup-inner]',
      newsletterPopup: '[data-newsletter]',
      newsletterPopupHolder: '[data-newsletter-holder]',
      newsletterField: '[data-newsletter-field]',
      newsletterForm: '[data-newsletter-form]',
      promoPopup: '[data-promo-text]',
      delayAttribite: 'data-popup-delay',
      cookieNameAttribute: 'data-cookie-name',
      dataTargetReferrer: 'data-target-referrer',
    };

    const classes$1 = {
      hide: 'hide',
      hasValue: 'has-value',
      success: 'has-success',
      desktop: 'desktop',
      mobile: 'mobile',
    };

    let sections$1 = {};

    class PopupCookie {
      constructor(name, value) {
        this.configuration = {
          expires: null, // session cookie
          path: '/',
          domain: window.location.hostname,
        };
        this.name = name;
        this.value = value;
      }

      write() {
        const hasCookie = document.cookie.indexOf('; ') !== -1 && !document.cookie.split('; ').find((row) => row.startsWith(this.name));
        if (hasCookie || document.cookie.indexOf('; ') === -1) {
          document.cookie = `${this.name}=${this.value}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
        }
      }

      read() {
        if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
          const returnCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(this.name))
            .split('=')[1];

          return returnCookie;
        } else return false;
      }

      destroy() {
        if (document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
          document.cookie = `${this.name}=null; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
        }
      }
    }

    class DelayShow {
      constructor(holder, element) {
        this.element = element;
        this.delay = holder.getAttribute(selectors$2.delayAttribite);

        if (this.delay === 'always') {
          this.always();
        }

        if (this.delay === 'delayed') {
          this.delayed();
        }

        if (this.delay === 'bottom') {
          this.bottom();
        }

        if (this.delay === 'idle') {
          this.idle();
        }
      }

      always() {
        fadeIn(this.element);
      }

      delayed() {
        // Show popup after 10s
        setTimeout(() => {
          fadeIn(this.element);
        }, 10000);
      }

      // Scroll to the bottom of the page
      bottom() {
        window.addEventListener('scroll', () => {
          if (window.scrollY + window.innerHeight >= document.body.clientHeight) {
            fadeIn(this.element);
          }
        });
      }

      // Idle for 1 min
      idle() {
        let timer = 0;
        let idleTime = 60000;
        const documentEvents = ['mousemove', 'mousedown', 'click', 'touchmove', 'touchstart', 'touchend', 'keydown', 'keypress'];
        const windowEvents = ['load', 'resize', 'scroll'];

        const startTimer = () => {
          timer = setTimeout(() => {
            timer = 0;
            fadeIn(this.element);
          }, idleTime);

          documentEvents.forEach((eventType) => {
            document.addEventListener(eventType, resetTimer);
          });

          windowEvents.forEach((eventType) => {
            window.addEventListener(eventType, resetTimer);
          });
        };

        const resetTimer = () => {
          if (timer) {
            clearTimeout(timer);
          }

          documentEvents.forEach((eventType) => {
            document.removeEventListener(eventType, resetTimer);
          });

          windowEvents.forEach((eventType) => {
            window.removeEventListener(eventType, resetTimer);
          });

          startTimer();
        };

        startTimer();
      }
    }

    class TargetReferrer {
      constructor(el) {
        this.el = el;
        this.locationPath = location.href;

        if (!this.el.hasAttribute(selectors$2.dataTargetReferrer)) {
          return;
        }

        this.init();
      }

      init() {
        if (this.locationPath.indexOf(this.el.getAttribute(selectors$2.dataTargetReferrer)) === -1) {
          this.el.parentNode.removeChild(this.el);
        }
      }
    }

    class Tracking {
      constructor(el) {
        this.popup = el;
        this.modal = document.querySelector(selectors$2.tracking);
        this.modalInner = this.popup.querySelector(selectors$2.popupInner);
        this.close = this.modal.querySelector(selectors$2.close);
        this.acceptButton = this.modal.querySelector(selectors$2.trackingAccept);
        this.enable = this.modal.getAttribute('data-enable') === 'true';
        this.showPopup = false;

        window.Shopify.loadFeatures(
          [
            {
              name: 'consent-tracking-api',
              version: '0.1',
            },
          ],
          (error) => {
            if (error) {
              throw error;
            }

            const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked();
            const userTrackingConsent = window.Shopify.customerPrivacy.getTrackingConsent();

            this.showPopup = !userCanBeTracked && userTrackingConsent === 'no_interaction' && this.enable;

            if (window.Shopify.designMode) {
              this.showPopup = false;
              fadeOut(this.modalInner);
            }

            this.init();
          }
        );
      }

      init() {
        if (this.showPopup) {
          fadeIn(this.modalInner);
        }

        this.clickEvents();
      }

      clickEvents() {
        this.close.addEventListener('click', (event) => {
          event.preventDefault();

          window.Shopify.customerPrivacy.setTrackingConsent(false, () => fadeOut(this.modalInner));
        });

        this.acceptButton.addEventListener('click', (event) => {
          event.preventDefault();

          window.Shopify.customerPrivacy.setTrackingConsent(true, () => fadeOut(this.modalInner));
        });

        document.addEventListener('trackingConsentAccepted', function () {
          console.log('trackingConsentAccepted event fired');
        });
      }

      onBlockSelect(evt) {
        if (this.popup.contains(evt.target)) {
          setTimeout(() => {
            fadeIn(this.modalInner);
          }, 400);
        }
      }

      onBlockDeselect(evt) {
        if (this.popup.contains(evt.target)) {
          fadeOut(this.modalInner);
        }
      }
    }

    class PromoText {
      constructor(el) {
        this.popup = el;
        this.popupInner = this.popup.querySelector(selectors$2.popupInner);
        this.close = this.popup.querySelector(selectors$2.close);
        this.cookie = new PopupCookie(this.popup.getAttribute(selectors$2.cookieNameAttribute), 'user_has_closed');
        this.isTargeted = new TargetReferrer(this.popup);
        this.hasDeviceClass = '';

        this.init();
      }

      init() {
        const cookieExists = this.cookie.read() !== false;

        if (!cookieExists || window.Shopify.designMode) {
          if (!window.Shopify.designMode) {
            new DelayShow(this.popup, this.popupInner);
          }

          this.clickEvents();
        }
      }

      clickEvents() {
        this.close.addEventListener('click', (event) => {
          event.preventDefault();

          fadeOut(this.popupInner);
          this.cookie.write();
        });
      }

      onBlockSelect(evt) {
        if (this.popup.classList.contains(classes$1.mobile)) {
          this.hasDeviceClass = classes$1.mobile;
        }

        if (this.popup.classList.contains(classes$1.desktop)) {
          this.hasDeviceClass = classes$1.desktop;
        }

        if (this.hasDeviceClass !== '') {
          this.popup.classList.remove(this.hasDeviceClass);
        }

        if (this.popup.contains(evt.target)) {
          setTimeout(() => {
            fadeIn(this.popupInner);
          }, 400);
        }
      }

      onBlockDeselect(evt) {
        if (this.popup.contains(evt.target)) {
          fadeOut(this.popupInner);
        }

        if (this.hasDeviceClass !== '') {
          this.popup.classList.add(this.hasDeviceClass);
        }
      }
    }

    class NewsletterPopup {
      constructor(el) {
        this.popup = el;
        this.popupInner = this.popup.querySelector(selectors$2.popupInner);
        this.holder = this.popup.querySelector(selectors$2.newsletterPopupHolder);
        this.close = this.popup.querySelector(selectors$2.close);
        this.newsletterField = this.popup.querySelector(selectors$2.newsletterField);
        this.cookie = new PopupCookie(this.popup.getAttribute(selectors$2.cookieNameAttribute), 'newsletter_is_closed');
        this.form = this.popup.querySelector(selectors$2.newsletterForm);
        this.isTargeted = new TargetReferrer(this.popup);
        this.hasDeviceClass = '';

        this.init();
      }

      init() {
        const cookieExists = this.cookie.read() !== false;

        if (!cookieExists || window.Shopify.designMode) {
          this.show();

          if (this.form.classList.contains(classes$1.success)) {
            this.checkForSuccess();
          }
        }
      }

      show() {
        if (!window.Shopify.designMode) {
          new DelayShow(this.popup, this.popupInner);
        }

        this.inputField();
        this.closePopup();
      }

      checkForSuccess() {
        fadeIn(this.popupInner);
        this.cookie.write();
      }

      closePopup() {
        this.close.addEventListener('click', (event) => {
          event.preventDefault();

          fadeOut(this.popupInner);
          this.cookie.write();
        });
      }

      inputField() {
        this.newsletterField.addEventListener('input', () => {
          if (this.newsletterField.value !== '') {
            this.holder.classList.add(classes$1.hasValue, this.newsletterField.value !== '');
          }
        });

        this.newsletterField.addEventListener('focus', () => {
          if (this.newsletterField.value !== '') {
            this.holder.classList.add(classes$1.hasValue, this.newsletterField.value !== '');
          }
        });

        this.newsletterField.addEventListener('focusout', () => {
          setTimeout(() => {
            this.holder.classList.remove(classes$1.hasValue);
          }, 2000);
        });
      }

      onBlockSelect(evt) {
        if (this.popup.classList.contains(classes$1.mobile)) {
          this.hasDeviceClass = classes$1.mobile;
        }

        if (this.popup.classList.contains(classes$1.desktop)) {
          this.hasDeviceClass = classes$1.desktop;
        }

        if (this.hasDeviceClass !== '') {
          this.popup.classList.remove(this.hasDeviceClass);
        }

        if (this.popup.contains(evt.target)) {
          setTimeout(() => {
            fadeIn(this.popupInner);
          }, 400);
        }
      }

      onBlockDeselect(evt) {
        if (this.popup.contains(evt.target)) {
          fadeOut(this.popupInner);
        }

        if (this.hasDeviceClass !== '') {
          this.popup.classList.add(this.hasDeviceClass);
        }
      }
    }

    const popupSection = {
      onLoad() {
        sections$1[this.id] = [];

        const tracking = this.container.querySelectorAll(selectors$2.tracking);
        tracking.forEach((el) => {
          sections$1[this.id].push(new Tracking(el));
        });

        const newsletterPopup = this.container.querySelectorAll(selectors$2.newsletterPopup);
        newsletterPopup.forEach((el) => {
          sections$1[this.id].push(new NewsletterPopup(el));
        });

        const promoPopup = this.container.querySelectorAll(selectors$2.promoPopup);
        promoPopup.forEach((el) => {
          sections$1[this.id].push(new PromoText(el));
        });
      },
      onBlockSelect(evt) {
        sections$1[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(evt);
          }
        });
      },
      onBlockDeselect(evt) {
        sections$1[this.id].forEach((el) => {
          if (typeof el.onBlockDeselect === 'function') {
            el.onBlockDeselect(evt);
          }
        });
      },
    };

    register('popups', [newsletterCheckForResultSection, popupSection]);

    register('newsletter', [newsletterCheckForResultSection]);

    register('section-icons', [slider, blockScroll]);

    const sections = {};

    const selectors$1 = {
      logo: '[data-slider-logo]',
      text: '[data-slider-text]',
      slide: 'data-slide',
      slideIndex: 'data-slide-index',
    };

    const classes = {
      flickityEnabled: 'flickity-enabled',
      isSelected: 'is-selected',
    };

    const variables = {
      slideNavWidth: 200,
    };

    class Press {
      constructor(section) {
        this.container = section.container;
        this.sliderNav = this.container.querySelector(selectors$1.logo);
        this.slideshowText = this.container.querySelector(selectors$1.text);

        this.flkty = null;
        this.flktyNav = null;

        if (this.sliderNav && this.slideshowText) {
          this.logoSlides = this.sliderNav.querySelectorAll(`[${selectors$1.slide}]`);
          this.resizeEvent = debounce$1(() => this.initSliderNav(), 500);

          this.init();
        }
      }

      init() {
        this.flkty = new FlickityFade(this.slideshowText, {
          fade: true,
          autoPlay: false,
          prevNextButtons: false,
          cellAlign: 'left',
          contain: true,
          pageDots: false,
          wrapAround: false,
          selectedAttraction: 0.2,
          friction: 0.6,
          draggable: false,
        });

        this.clickSliderNavEvents();
        this.initSliderNav();
      }

      calculateMarginTextSlides() {
        const textSlides = this.slideshowText.querySelectorAll(`[${selectors$1.slide}]`);
        if (textSlides.length) {
          const maxHeight = Math.max.apply(
            null,
            [...textSlides].map((element) => {
              const height = element.clientHeight || element.offsetHeight;
              return height;
            })
          );

          textSlides.forEach((element) => {
            const elementHeight = element.clientHeight || element.offsetHeight;

            if (elementHeight < maxHeight) {
              const calculateMargin = Math.ceil((maxHeight - elementHeight) / 2);
              element.style.margin = `${calculateMargin}px 0`;
            }
          });
        }
      }

      initSliderNav() {
        this.activeSliderNav();
        this.setDefaultStatesOnSliderNav();
        this.calculateMarginTextSlides();

        window.addEventListener('resize', this.resizeEvent);
      }

      setDefaultStatesOnSliderNav() {
        const selectedSlide = this.sliderNav.querySelector(`.${classes.isSelected}`);
        if (selectedSlide) {
          selectedSlide.classList.remove(classes.isSelected);
          this.logoSlides[0].classList.add(classes.isSelected);
        }

        if (this.sliderNavAvailable) {
          if (this.flktyNav === null) {
            this.flktyNav = new Flickity(this.sliderNav, {
              prevNextButtons: false,
              contain: true,
              pageDots: false,
              wrapAround: true,
              watchCSS: true,
              selectedAttraction: 0.05,
              friction: 0.8,
              initialIndex: 0,
              freeScroll: true,
            });

            if (this.flktyNav) {
              this.flkty.select(0);

              this.flktyNav.on('change', (index) => this.flkty.select(index));
              this.flktyNav.resize();
            }
          }
        } else {
          if (this.flktyNav !== null) {
            this.flktyNav.destroy();
            this.flktyNav = null;
          }

          this.logoSlides[0].classList.add(classes.isSelected);

          if (this.flkty) {
            this.flkty.select(0);
          }
        }
      }

      clickSliderNavEvents() {
        this.logoSlides.forEach((slide) => {
          slide.addEventListener('click', (e) => {
            const currentTarget = e.currentTarget;
            const selectedIndex = Number(currentTarget.getAttribute(selectors$1.slideIndex));
            const hasSlider = this.sliderNav.classList.contains(classes.flickityEnabled);

            if (this.flkty) {
              this.flkty.select(selectedIndex);
            }

            if (hasSlider) {
              this.flktyNav.select(selectedIndex);
            }

            if (!hasSlider) {
              const selectedSlide = this.sliderNav.querySelector(`.${classes.isSelected}`);

              if (selectedSlide) {
                selectedSlide.classList.remove(classes.isSelected);
              }

              currentTarget.classList.add(classes.isSelected);
            }
          });
        });
      }

      activeSliderNav() {
        const slidesCount = this.sliderNav.querySelectorAll(`[${selectors$1.slide}]`).length;
        const parentWidth = this.sliderNav.parentNode.offsetWidth || this.sliderNav.parentNode.clientWidth;
        const slidesWidth = slidesCount * variables.slideNavWidth;

        this.sliderNavAvailable = slidesWidth > parentWidth;
      }

      onUnload() {
        if (this.flktyNav) {
          this.flktyNav.destroy();
        }

        if (this.flkty) {
          this.flkty.destroy();
        }

        window.removeEventListener('resize', this.resizeEvent);
      }

      onBlockSelect(e) {
        if (!this.sliderNav) return;

        const selectedSlide = this.sliderNav.querySelector(`[${selectors$1.slide}="${e.detail.blockId}"]`);
        const slideIndex = parseInt(selectedSlide.getAttribute(selectors$1.slideIndex));

        this.calculateMarginTextSlides();

        if (this.flkty) {
          this.flkty.select(slideIndex);
        }

        if (this.sliderNav.classList.contains(classes.isSelected)) {
          this.sliderNav.classList.add(classes.isSelected);
          this.sliderNav.select(slideIndex);
        } else {
          selectedSlide.dispatchEvent(new Event('click'));
        }
      }

      onSelect() {
        window.removeEventListener('resize', this.resizeEvent);

        this.initSliderNav();
      }
    }

    const press = {
      onLoad() {
        sections[this.id] = new Press(this);
      },
      onUnload(e) {
        sections[this.id].onUnload(e);
      },
      onSelect() {
        if (this.type === 'press') {
          sections[this.id].onSelect();
        }
      },
      onBlockSelect(e) {
        sections[this.id].onBlockSelect(e);
      },
    };

    register('press', [press, blockScroll]);

    register('logo-list', [customScrollbar, blockScroll]);

    const wrap = (toWrap, wrapperClass = '', wrapper) => {
      wrapper = wrapper || document.createElement('div');
      wrapper.classList.add(wrapperClass);
      toWrap.parentNode.insertBefore(wrapper, toWrap);
      return wrapper.appendChild(toWrap);
    };

    const loaders = {};

    function loadScript(options = {}) {
      if (!options.type) {
        options.type = 'json';
      }

      if (options.url) {
        if (loaders[options.url]) {
          return loaders[options.url];
        } else {
          return getScriptWithPromise(options.url, options.type);
        }
      } else if (options.json) {
        if (loaders[options.json]) {
          return Promise.resolve(loaders[options.json]);
        } else {
          return window
            .fetch(options.json)
            .then((response) => {
              return response.json();
            })
            .then((response) => {
              loaders[options.json] = response;
              return response;
            });
        }
      } else if (options.name) {
        const key = ''.concat(options.name, options.version);
        if (loaders[key]) {
          return loaders[key];
        } else {
          return loadShopifyWithPromise(options);
        }
      } else {
        return Promise.reject();
      }
    }

    function getScriptWithPromise(url, type) {
      const loader = new Promise((resolve, reject) => {
        if (type === 'text') {
          fetch(url)
            .then((response) => response.text())
            .then((data) => {
              resolve(data);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          getScript(
            url,
            function () {
              resolve();
            },
            function () {
              reject();
            }
          );
        }
      });

      loaders[url] = loader;
      return loader;
    }

    function loadShopifyWithPromise(options) {
      const key = ''.concat(options.name, options.version);
      const loader = new Promise((resolve, reject) => {
        try {
          window.Shopify.loadFeatures([
            {
              name: options.name,
              version: options.version,
              onLoad: (err) => {
                onLoadFromShopify(resolve, reject, err);
              },
            },
          ]);
        } catch (err) {
          reject(err);
        }
      });
      loaders[key] = loader;
      return loader;
    }

    function onLoadFromShopify(resolve, reject, err) {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      // Load all registered sections on the page.
      load('*');

      // Target tables to make them scrollable
      const tableSelectors = '.rte table';
      const tables = document.querySelectorAll(tableSelectors);
      tables.forEach((table) => {
        wrap(table, 'rte__table-wrapper');
      });

      // Target iframes to make them responsive
      const iframeSelectors = '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"], .rte iframe#admin_bar_iframe';
      const frames = document.querySelectorAll(iframeSelectors);
      frames.forEach((frame) => {
        wrap(frame, 'rte__video-wrapper');
      });

      document.addEventListener('mousedown', () => {
        document.body.classList.remove('focus-enabled');
      });
      document.addEventListener('keyup', (event) => {
        if (event.keyCode === 9) {
          document.body.classList.add('focus-enabled');
        }
      });

      // Apply a specific class to the html element for browser support of cookies.
      if (window.navigator.cookieEnabled) {
        document.documentElement.className = document.documentElement.className.replace('supports-no-cookies', 'supports-cookies');
      }

      // Common a11y fixes
      focusHash();
      bindInPageLinks();

      let hasNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;
      if (!hasNativeSmoothScroll) {
        loadScript({url: window.theme.assets.smoothscroll});
      }
    });

    // packages/intersect/src/index.js
    function src_default$2(Alpine) {
      Alpine.directive("intersect", Alpine.skipDuringClone((el, { value, expression, modifiers }, { evaluateLater, cleanup }) => {
        let evaluate = evaluateLater(expression);
        let options = {
          rootMargin: getRootMargin(modifiers),
          threshold: getThreshold(modifiers)
        };
        let observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting === (value === "leave"))
              return;
            evaluate();
            modifiers.includes("once") && observer.disconnect();
          });
        }, options);
        observer.observe(el);
        cleanup(() => {
          observer.disconnect();
        });
      }));
    }
    function getThreshold(modifiers) {
      if (modifiers.includes("full"))
        return 0.99;
      if (modifiers.includes("half"))
        return 0.5;
      if (!modifiers.includes("threshold"))
        return 0;
      let threshold = modifiers[modifiers.indexOf("threshold") + 1];
      if (threshold === "100")
        return 1;
      if (threshold === "0")
        return 0;
      return Number(`.${threshold}`);
    }
    function getLengthValue(rawValue) {
      let match = rawValue.match(/^(-?[0-9]+)(px|%)?$/);
      return match ? match[1] + (match[2] || "px") : void 0;
    }
    function getRootMargin(modifiers) {
      const key = "margin";
      const fallback = "0px 0px 0px 0px";
      const index = modifiers.indexOf(key);
      if (index === -1)
        return fallback;
      let values = [];
      for (let i = 1; i < 5; i++) {
        values.push(getLengthValue(modifiers[index + i] || ""));
      }
      values = values.filter((v) => v !== void 0);
      return values.length ? values.join(" ").trim() : fallback;
    }

    // packages/intersect/builds/module.js
    var module_default$2 = src_default$2;

    // packages/morph/src/morph.js
    function morph(from, toHtml, options) {
      monkeyPatchDomSetAttributeToAllowAtSymbols();
      let context = createMorphContext(options);
      let toEl = typeof toHtml === "string" ? createElement(toHtml) : toHtml;
      if (window.Alpine && window.Alpine.closestDataStack && !from._x_dataStack) {
        toEl._x_dataStack = window.Alpine.closestDataStack(from);
        toEl._x_dataStack && window.Alpine.cloneNode(from, toEl);
      }
      context.patch(from, toEl);
      return from;
    }
    function morphBetween(startMarker, endMarker, toHtml, options = {}) {
      monkeyPatchDomSetAttributeToAllowAtSymbols();
      let context = createMorphContext(options);
      let fromContainer = startMarker.parentNode;
      let fromBlock = new Block(startMarker, endMarker);
      let toContainer = typeof toHtml === "string" ? (() => {
        let container = document.createElement("div");
        container.insertAdjacentHTML("beforeend", toHtml);
        return container;
      })() : toHtml;
      let toStartMarker = document.createComment("[morph-start]");
      let toEndMarker = document.createComment("[morph-end]");
      toContainer.insertBefore(toStartMarker, toContainer.firstChild);
      toContainer.appendChild(toEndMarker);
      let toBlock = new Block(toStartMarker, toEndMarker);
      if (window.Alpine && window.Alpine.closestDataStack) {
        toContainer._x_dataStack = window.Alpine.closestDataStack(fromContainer);
        toContainer._x_dataStack && window.Alpine.cloneNode(fromContainer, toContainer);
      }
      context.patchChildren(fromBlock, toBlock);
    }
    function createMorphContext(options = {}) {
      let defaultGetKey = (el) => el.getAttribute("key");
      let noop = () => {
      };
      let context = {
        key: options.key || defaultGetKey,
        lookahead: options.lookahead || false,
        updating: options.updating || noop,
        updated: options.updated || noop,
        removing: options.removing || noop,
        removed: options.removed || noop,
        adding: options.adding || noop,
        added: options.added || noop
      };
      context.patch = function(from, to) {
        if (context.differentElementNamesTypesOrKeys(from, to)) {
          return context.swapElements(from, to);
        }
        let updateChildrenOnly = false;
        let skipChildren = false;
        let skipUntil = (predicate) => context.skipUntilCondition = predicate;
        if (shouldSkipChildren(context.updating, () => skipChildren = true, skipUntil, from, to, () => updateChildrenOnly = true))
          return;
        if (from.nodeType === 1 && window.Alpine) {
          window.Alpine.cloneNode(from, to);
          if (from._x_teleport && to._x_teleport) {
            context.patch(from._x_teleport, to._x_teleport);
          }
        }
        if (textOrComment(to)) {
          context.patchNodeValue(from, to);
          context.updated(from, to);
          return;
        }
        if (!updateChildrenOnly) {
          context.patchAttributes(from, to);
        }
        context.updated(from, to);
        if (!skipChildren) {
          context.patchChildren(from, to);
        }
      };
      context.differentElementNamesTypesOrKeys = function(from, to) {
        return from.nodeType != to.nodeType || from.nodeName != to.nodeName || context.getKey(from) != context.getKey(to);
      };
      context.swapElements = function(from, to) {
        if (shouldSkip(context.removing, from))
          return;
        let toCloned = to.cloneNode(true);
        if (shouldSkip(context.adding, toCloned))
          return;
        from.replaceWith(toCloned);
        context.removed(from);
        context.added(toCloned);
      };
      context.patchNodeValue = function(from, to) {
        let value = to.nodeValue;
        if (from.nodeValue !== value) {
          from.nodeValue = value;
        }
      };
      context.patchAttributes = function(from, to) {
        if (from._x_transitioning)
          return;
        if (from._x_isShown && !to._x_isShown) {
          return;
        }
        if (!from._x_isShown && to._x_isShown) {
          return;
        }
        let domAttributes = Array.from(from.attributes);
        let toAttributes = Array.from(to.attributes);
        for (let i = domAttributes.length - 1; i >= 0; i--) {
          let name = domAttributes[i].name;
          if (!to.hasAttribute(name)) {
            from.removeAttribute(name);
          }
        }
        for (let i = toAttributes.length - 1; i >= 0; i--) {
          let name = toAttributes[i].name;
          let value = toAttributes[i].value;
          if (from.getAttribute(name) !== value) {
            from.setAttribute(name, value);
          }
        }
      };
      context.patchChildren = function(from, to) {
        let fromKeys = context.keyToMap(from.children);
        let fromKeyHoldovers = {};
        let currentTo = getFirstNode(to);
        let currentFrom = getFirstNode(from);
        while (currentTo) {
          seedingMatchingId(currentTo, currentFrom);
          let toKey = context.getKey(currentTo);
          let fromKey = context.getKey(currentFrom);
          if (context.skipUntilCondition) {
            let fromDone = !currentFrom || context.skipUntilCondition(currentFrom);
            let toDone = !currentTo || context.skipUntilCondition(currentTo);
            if (fromDone && toDone) {
              context.skipUntilCondition = null;
            } else {
              if (!fromDone)
                currentFrom = currentFrom && getNextSibling(from, currentFrom);
              if (!toDone)
                currentTo = currentTo && getNextSibling(to, currentTo);
              continue;
            }
          }
          if (!currentFrom) {
            if (toKey && fromKeyHoldovers[toKey]) {
              let holdover = fromKeyHoldovers[toKey];
              from.appendChild(holdover);
              currentFrom = holdover;
              fromKey = context.getKey(currentFrom);
            } else {
              if (!shouldSkip(context.adding, currentTo)) {
                let clone = currentTo.cloneNode(true);
                from.appendChild(clone);
                context.added(clone);
              }
              currentTo = getNextSibling(to, currentTo);
              continue;
            }
          }
          let isIf = (node) => node && node.nodeType === 8 && node.textContent === "[if BLOCK]><![endif]";
          let isEnd = (node) => node && node.nodeType === 8 && node.textContent === "[if ENDBLOCK]><![endif]";
          if (isIf(currentTo) && isIf(currentFrom)) {
            let nestedIfCount = 0;
            let fromBlockStart = currentFrom;
            while (currentFrom) {
              let next = getNextSibling(from, currentFrom);
              if (isIf(next)) {
                nestedIfCount++;
              } else if (isEnd(next) && nestedIfCount > 0) {
                nestedIfCount--;
              } else if (isEnd(next) && nestedIfCount === 0) {
                currentFrom = next;
                break;
              }
              currentFrom = next;
            }
            let fromBlockEnd = currentFrom;
            nestedIfCount = 0;
            let toBlockStart = currentTo;
            while (currentTo) {
              let next = getNextSibling(to, currentTo);
              if (isIf(next)) {
                nestedIfCount++;
              } else if (isEnd(next) && nestedIfCount > 0) {
                nestedIfCount--;
              } else if (isEnd(next) && nestedIfCount === 0) {
                currentTo = next;
                break;
              }
              currentTo = next;
            }
            let toBlockEnd = currentTo;
            let fromBlock = new Block(fromBlockStart, fromBlockEnd);
            let toBlock = new Block(toBlockStart, toBlockEnd);
            context.patchChildren(fromBlock, toBlock);
            continue;
          }
          if (currentFrom.nodeType === 1 && context.lookahead && !currentFrom.isEqualNode(currentTo)) {
            let nextToElementSibling = getNextSibling(to, currentTo);
            let found = false;
            while (!found && nextToElementSibling) {
              if (nextToElementSibling.nodeType === 1 && currentFrom.isEqualNode(nextToElementSibling)) {
                found = true;
                currentFrom = context.addNodeBefore(from, currentTo, currentFrom);
                fromKey = context.getKey(currentFrom);
              }
              nextToElementSibling = getNextSibling(to, nextToElementSibling);
            }
          }
          if (toKey !== fromKey) {
            if (!toKey && fromKey) {
              fromKeyHoldovers[fromKey] = currentFrom;
              currentFrom = context.addNodeBefore(from, currentTo, currentFrom);
              fromKeyHoldovers[fromKey].remove();
              currentFrom = getNextSibling(from, currentFrom);
              currentTo = getNextSibling(to, currentTo);
              continue;
            }
            if (toKey && !fromKey) {
              if (fromKeys[toKey]) {
                currentFrom.replaceWith(fromKeys[toKey]);
                currentFrom = fromKeys[toKey];
                fromKey = context.getKey(currentFrom);
              }
            }
            if (toKey && fromKey) {
              let fromKeyNode = fromKeys[toKey];
              if (fromKeyNode) {
                fromKeyHoldovers[fromKey] = currentFrom;
                currentFrom.replaceWith(fromKeyNode);
                currentFrom = fromKeyNode;
                fromKey = context.getKey(currentFrom);
              } else {
                fromKeyHoldovers[fromKey] = currentFrom;
                currentFrom = context.addNodeBefore(from, currentTo, currentFrom);
                fromKeyHoldovers[fromKey].remove();
                currentFrom = getNextSibling(from, currentFrom);
                currentTo = getNextSibling(to, currentTo);
                continue;
              }
            }
          }
          let currentFromNext = currentFrom && getNextSibling(from, currentFrom);
          context.patch(currentFrom, currentTo);
          currentTo = currentTo && getNextSibling(to, currentTo);
          currentFrom = currentFromNext;
        }
        let removals = [];
        while (currentFrom) {
          if (!shouldSkip(context.removing, currentFrom))
            removals.push(currentFrom);
          currentFrom = getNextSibling(from, currentFrom);
        }
        while (removals.length) {
          let domForRemoval = removals.shift();
          domForRemoval.remove();
          context.removed(domForRemoval);
        }
      };
      context.getKey = function(el) {
        return el && el.nodeType === 1 && context.key(el);
      };
      context.keyToMap = function(els) {
        let map = {};
        for (let el of els) {
          let theKey = context.getKey(el);
          if (theKey) {
            map[theKey] = el;
          }
        }
        return map;
      };
      context.addNodeBefore = function(parent, node, beforeMe) {
        if (!shouldSkip(context.adding, node)) {
          let clone = node.cloneNode(true);
          parent.insertBefore(clone, beforeMe);
          context.added(clone);
          return clone;
        }
        return node;
      };
      return context;
    }
    morph.step = () => {
    };
    morph.log = () => {
    };
    function shouldSkip(hook, ...args) {
      let skip = false;
      hook(...args, () => skip = true);
      return skip;
    }
    function shouldSkipChildren(hook, skipChildren, skipUntil, ...args) {
      let skip = false;
      hook(...args, () => skip = true, skipChildren, skipUntil);
      return skip;
    }
    var patched = false;
    function createElement(html) {
      const template = document.createElement("template");
      template.innerHTML = html;
      return template.content.firstElementChild;
    }
    function textOrComment(el) {
      return el.nodeType === 3 || el.nodeType === 8;
    }
    var Block = class {
      constructor(start, end) {
        this.startComment = start;
        this.endComment = end;
      }
      get children() {
        let children = [];
        let currentNode = this.startComment.nextSibling;
        while (currentNode && currentNode !== this.endComment) {
          children.push(currentNode);
          currentNode = currentNode.nextSibling;
        }
        return children;
      }
      appendChild(child) {
        this.endComment.before(child);
      }
      get firstChild() {
        let first = this.startComment.nextSibling;
        if (first === this.endComment)
          return;
        return first;
      }
      nextNode(reference) {
        let next = reference.nextSibling;
        if (next === this.endComment)
          return;
        return next;
      }
      insertBefore(newNode, reference) {
        reference.before(newNode);
        return newNode;
      }
    };
    function getFirstNode(parent) {
      return parent.firstChild;
    }
    function getNextSibling(parent, reference) {
      let next;
      if (parent instanceof Block) {
        next = parent.nextNode(reference);
      } else {
        next = reference.nextSibling;
      }
      return next;
    }
    function monkeyPatchDomSetAttributeToAllowAtSymbols() {
      if (patched)
        return;
      patched = true;
      let original = Element.prototype.setAttribute;
      let hostDiv = document.createElement("div");
      Element.prototype.setAttribute = function newSetAttribute(name, value) {
        if (!name.includes("@")) {
          return original.call(this, name, value);
        }
        hostDiv.innerHTML = `<span ${name}="${value}"></span>`;
        let attr = hostDiv.firstElementChild.getAttributeNode(name);
        hostDiv.firstElementChild.removeAttributeNode(attr);
        this.setAttributeNode(attr);
      };
    }
    function seedingMatchingId(to, from) {
      let fromId = from && from._x_bindings && from._x_bindings.id;
      if (!fromId)
        return;
      if (!to.setAttribute)
        return;
      to.setAttribute("id", fromId);
      to.id = fromId;
    }

    // packages/morph/src/index.js
    function src_default$1(Alpine) {
      Alpine.morph = morph;
      Alpine.morphBetween = morphBetween;
    }

    // packages/morph/builds/module.js
    var module_default$1 = src_default$1;

    // packages/alpinejs/src/scheduler.js
    var flushPending = false;
    var flushing = false;
    var queue = [];
    var lastFlushedIndex = -1;
    function scheduler(callback) {
      queueJob(callback);
    }
    function queueJob(job) {
      if (!queue.includes(job))
        queue.push(job);
      queueFlush();
    }
    function dequeueJob(job) {
      let index = queue.indexOf(job);
      if (index !== -1 && index > lastFlushedIndex)
        queue.splice(index, 1);
    }
    function queueFlush() {
      if (!flushing && !flushPending) {
        flushPending = true;
        queueMicrotask(flushJobs);
      }
    }
    function flushJobs() {
      flushPending = false;
      flushing = true;
      for (let i = 0; i < queue.length; i++) {
        queue[i]();
        lastFlushedIndex = i;
      }
      queue.length = 0;
      lastFlushedIndex = -1;
      flushing = false;
    }

    // packages/alpinejs/src/reactivity.js
    var reactive;
    var effect;
    var release;
    var raw;
    var shouldSchedule = true;
    function disableEffectScheduling(callback) {
      shouldSchedule = false;
      callback();
      shouldSchedule = true;
    }
    function setReactivityEngine(engine) {
      reactive = engine.reactive;
      release = engine.release;
      effect = (callback) => engine.effect(callback, { scheduler: (task) => {
        if (shouldSchedule) {
          scheduler(task);
        } else {
          task();
        }
      } });
      raw = engine.raw;
    }
    function overrideEffect(override) {
      effect = override;
    }
    function elementBoundEffect(el) {
      let cleanup2 = () => {
      };
      let wrappedEffect = (callback) => {
        let effectReference = effect(callback);
        if (!el._x_effects) {
          el._x_effects = /* @__PURE__ */ new Set();
          el._x_runEffects = () => {
            el._x_effects.forEach((i) => i());
          };
        }
        el._x_effects.add(effectReference);
        cleanup2 = () => {
          if (effectReference === void 0)
            return;
          el._x_effects.delete(effectReference);
          release(effectReference);
        };
        return effectReference;
      };
      return [wrappedEffect, () => {
        cleanup2();
      }];
    }
    function watch(getter, callback) {
      let firstTime = true;
      let oldValue;
      let effectReference = effect(() => {
        let value = getter();
        JSON.stringify(value);
        if (!firstTime) {
          queueMicrotask(() => {
            callback(value, oldValue);
            oldValue = value;
          });
        } else {
          oldValue = value;
        }
        firstTime = false;
      });
      return () => release(effectReference);
    }

    // packages/alpinejs/src/mutation.js
    var onAttributeAddeds = [];
    var onElRemoveds = [];
    var onElAddeds = [];
    function onElAdded(callback) {
      onElAddeds.push(callback);
    }
    function onElRemoved(el, callback) {
      if (typeof callback === "function") {
        if (!el._x_cleanups)
          el._x_cleanups = [];
        el._x_cleanups.push(callback);
      } else {
        callback = el;
        onElRemoveds.push(callback);
      }
    }
    function onAttributesAdded(callback) {
      onAttributeAddeds.push(callback);
    }
    function onAttributeRemoved(el, name, callback) {
      if (!el._x_attributeCleanups)
        el._x_attributeCleanups = {};
      if (!el._x_attributeCleanups[name])
        el._x_attributeCleanups[name] = [];
      el._x_attributeCleanups[name].push(callback);
    }
    function cleanupAttributes(el, names) {
      if (!el._x_attributeCleanups)
        return;
      Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
        if (names === void 0 || names.includes(name)) {
          value.forEach((i) => i());
          delete el._x_attributeCleanups[name];
        }
      });
    }
    function cleanupElement(el) {
      el._x_effects?.forEach(dequeueJob);
      while (el._x_cleanups?.length)
        el._x_cleanups.pop()();
    }
    var observer = new MutationObserver(onMutate);
    var currentlyObserving = false;
    function startObservingMutations() {
      observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
      currentlyObserving = true;
    }
    function stopObservingMutations() {
      flushObserver();
      observer.disconnect();
      currentlyObserving = false;
    }
    var queuedMutations = [];
    function flushObserver() {
      let records = observer.takeRecords();
      queuedMutations.push(() => records.length > 0 && onMutate(records));
      let queueLengthWhenTriggered = queuedMutations.length;
      queueMicrotask(() => {
        if (queuedMutations.length === queueLengthWhenTriggered) {
          while (queuedMutations.length > 0)
            queuedMutations.shift()();
        }
      });
    }
    function mutateDom(callback) {
      if (!currentlyObserving)
        return callback();
      stopObservingMutations();
      let result = callback();
      startObservingMutations();
      return result;
    }
    var isCollecting = false;
    var deferredMutations = [];
    function deferMutations() {
      isCollecting = true;
    }
    function flushAndStopDeferringMutations() {
      isCollecting = false;
      onMutate(deferredMutations);
      deferredMutations = [];
    }
    function onMutate(mutations) {
      if (isCollecting) {
        deferredMutations = deferredMutations.concat(mutations);
        return;
      }
      let addedNodes = [];
      let removedNodes = /* @__PURE__ */ new Set();
      let addedAttributes = /* @__PURE__ */ new Map();
      let removedAttributes = /* @__PURE__ */ new Map();
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].target._x_ignoreMutationObserver)
          continue;
        if (mutations[i].type === "childList") {
          mutations[i].removedNodes.forEach((node) => {
            if (node.nodeType !== 1)
              return;
            if (!node._x_marker)
              return;
            removedNodes.add(node);
          });
          mutations[i].addedNodes.forEach((node) => {
            if (node.nodeType !== 1)
              return;
            if (removedNodes.has(node)) {
              removedNodes.delete(node);
              return;
            }
            if (node._x_marker)
              return;
            addedNodes.push(node);
          });
        }
        if (mutations[i].type === "attributes") {
          let el = mutations[i].target;
          let name = mutations[i].attributeName;
          let oldValue = mutations[i].oldValue;
          let add2 = () => {
            if (!addedAttributes.has(el))
              addedAttributes.set(el, []);
            addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
          };
          let remove = () => {
            if (!removedAttributes.has(el))
              removedAttributes.set(el, []);
            removedAttributes.get(el).push(name);
          };
          if (el.hasAttribute(name) && oldValue === null) {
            add2();
          } else if (el.hasAttribute(name)) {
            remove();
            add2();
          } else {
            remove();
          }
        }
      }
      removedAttributes.forEach((attrs, el) => {
        cleanupAttributes(el, attrs);
      });
      addedAttributes.forEach((attrs, el) => {
        onAttributeAddeds.forEach((i) => i(el, attrs));
      });
      for (let node of removedNodes) {
        if (addedNodes.some((i) => i.contains(node)))
          continue;
        onElRemoveds.forEach((i) => i(node));
      }
      for (let node of addedNodes) {
        if (!node.isConnected)
          continue;
        onElAddeds.forEach((i) => i(node));
      }
      addedNodes = null;
      removedNodes = null;
      addedAttributes = null;
      removedAttributes = null;
    }

    // packages/alpinejs/src/scope.js
    function scope(node) {
      return mergeProxies(closestDataStack(node));
    }
    function addScopeToNode(node, data2, referenceNode) {
      node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
      return () => {
        node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
      };
    }
    function closestDataStack(node) {
      if (node._x_dataStack)
        return node._x_dataStack;
      if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
        return closestDataStack(node.host);
      }
      if (!node.parentNode) {
        return [];
      }
      return closestDataStack(node.parentNode);
    }
    function mergeProxies(objects) {
      return new Proxy({ objects }, mergeProxyTrap);
    }
    var mergeProxyTrap = {
      ownKeys({ objects }) {
        return Array.from(
          new Set(objects.flatMap((i) => Object.keys(i)))
        );
      },
      has({ objects }, name) {
        if (name == Symbol.unscopables)
          return false;
        return objects.some(
          (obj) => Object.prototype.hasOwnProperty.call(obj, name) || Reflect.has(obj, name)
        );
      },
      get({ objects }, name, thisProxy) {
        if (name == "toJSON")
          return collapseProxies;
        return Reflect.get(
          objects.find(
            (obj) => Reflect.has(obj, name)
          ) || {},
          name,
          thisProxy
        );
      },
      set({ objects }, name, value, thisProxy) {
        const target = objects.find(
          (obj) => Object.prototype.hasOwnProperty.call(obj, name)
        ) || objects[objects.length - 1];
        const descriptor = Object.getOwnPropertyDescriptor(target, name);
        if (descriptor?.set && descriptor?.get)
          return descriptor.set.call(thisProxy, value) || true;
        return Reflect.set(target, name, value);
      }
    };
    function collapseProxies() {
      let keys = Reflect.ownKeys(this);
      return keys.reduce((acc, key) => {
        acc[key] = Reflect.get(this, key);
        return acc;
      }, {});
    }

    // packages/alpinejs/src/interceptor.js
    function initInterceptors(data2) {
      let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
      let recurse = (obj, basePath = "") => {
        Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
          if (enumerable === false || value === void 0)
            return;
          if (typeof value === "object" && value !== null && value.__v_skip)
            return;
          let path = basePath === "" ? key : `${basePath}.${key}`;
          if (typeof value === "object" && value !== null && value._x_interceptor) {
            obj[key] = value.initialize(data2, path, key);
          } else {
            if (isObject2(value) && value !== obj && !(value instanceof Element)) {
              recurse(value, path);
            }
          }
        });
      };
      return recurse(data2);
    }
    function interceptor(callback, mutateObj = () => {
    }) {
      let obj = {
        initialValue: void 0,
        _x_interceptor: true,
        initialize(data2, path, key) {
          return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
        }
      };
      mutateObj(obj);
      return (initialValue) => {
        if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
          let initialize = obj.initialize.bind(obj);
          obj.initialize = (data2, path, key) => {
            let innerValue = initialValue.initialize(data2, path, key);
            obj.initialValue = innerValue;
            return initialize(data2, path, key);
          };
        } else {
          obj.initialValue = initialValue;
        }
        return obj;
      };
    }
    function get(obj, path) {
      return path.split(".").reduce((carry, segment) => carry[segment], obj);
    }
    function set(obj, path, value) {
      if (typeof path === "string")
        path = path.split(".");
      if (path.length === 1)
        obj[path[0]] = value;
      else if (path.length === 0)
        throw error;
      else {
        if (obj[path[0]])
          return set(obj[path[0]], path.slice(1), value);
        else {
          obj[path[0]] = {};
          return set(obj[path[0]], path.slice(1), value);
        }
      }
    }

    // packages/alpinejs/src/magics.js
    var magics = {};
    function magic(name, callback) {
      magics[name] = callback;
    }
    function injectMagics(obj, el) {
      let memoizedUtilities = getUtilities(el);
      Object.entries(magics).forEach(([name, callback]) => {
        Object.defineProperty(obj, `$${name}`, {
          get() {
            return callback(el, memoizedUtilities);
          },
          enumerable: false
        });
      });
      return obj;
    }
    function getUtilities(el) {
      let [utilities, cleanup2] = getElementBoundUtilities(el);
      let utils = { interceptor, ...utilities };
      onElRemoved(el, cleanup2);
      return utils;
    }

    // packages/alpinejs/src/utils/error.js
    function tryCatch(el, expression, callback, ...args) {
      try {
        return callback(...args);
      } catch (e) {
        handleError(e, el, expression);
      }
    }
    function handleError(error2, el, expression = void 0) {
      error2 = Object.assign(
        error2 ?? { message: "No error message given." },
        { el, expression }
      );
      console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
      setTimeout(() => {
        throw error2;
      }, 0);
    }

    // packages/alpinejs/src/evaluator.js
    var shouldAutoEvaluateFunctions = true;
    function dontAutoEvaluateFunctions(callback) {
      let cache = shouldAutoEvaluateFunctions;
      shouldAutoEvaluateFunctions = false;
      let result = callback();
      shouldAutoEvaluateFunctions = cache;
      return result;
    }
    function evaluate(el, expression, extras = {}) {
      let result;
      evaluateLater(el, expression)((value) => result = value, extras);
      return result;
    }
    function evaluateLater(...args) {
      return theEvaluatorFunction(...args);
    }
    var theEvaluatorFunction = normalEvaluator;
    function setEvaluator(newEvaluator) {
      theEvaluatorFunction = newEvaluator;
    }
    function normalEvaluator(el, expression) {
      let overriddenMagics = {};
      injectMagics(overriddenMagics, el);
      let dataStack = [overriddenMagics, ...closestDataStack(el)];
      let evaluator = typeof expression === "function" ? generateEvaluatorFromFunction(dataStack, expression) : generateEvaluatorFromString(dataStack, expression, el);
      return tryCatch.bind(null, el, expression, evaluator);
    }
    function generateEvaluatorFromFunction(dataStack, func) {
      return (receiver = () => {
      }, { scope: scope2 = {}, params = [], context } = {}) => {
        let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
        runIfTypeOfFunction(receiver, result);
      };
    }
    var evaluatorMemo = {};
    function generateFunctionFromString(expression, el) {
      if (evaluatorMemo[expression]) {
        return evaluatorMemo[expression];
      }
      let AsyncFunction = Object.getPrototypeOf(async function() {
      }).constructor;
      let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim()) ? `(async()=>{ ${expression} })()` : expression;
      const safeAsyncFunction = () => {
        try {
          let func2 = new AsyncFunction(
            ["__self", "scope"],
            `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`
          );
          Object.defineProperty(func2, "name", {
            value: `[Alpine] ${expression}`
          });
          return func2;
        } catch (error2) {
          handleError(error2, el, expression);
          return Promise.resolve();
        }
      };
      let func = safeAsyncFunction();
      evaluatorMemo[expression] = func;
      return func;
    }
    function generateEvaluatorFromString(dataStack, expression, el) {
      let func = generateFunctionFromString(expression, el);
      return (receiver = () => {
      }, { scope: scope2 = {}, params = [], context } = {}) => {
        func.result = void 0;
        func.finished = false;
        let completeScope = mergeProxies([scope2, ...dataStack]);
        if (typeof func === "function") {
          let promise = func.call(context, func, completeScope).catch((error2) => handleError(error2, el, expression));
          if (func.finished) {
            runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
            func.result = void 0;
          } else {
            promise.then((result) => {
              runIfTypeOfFunction(receiver, result, completeScope, params, el);
            }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
          }
        }
      };
    }
    function runIfTypeOfFunction(receiver, value, scope2, params, el) {
      if (shouldAutoEvaluateFunctions && typeof value === "function") {
        let result = value.apply(scope2, params);
        if (result instanceof Promise) {
          result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
        } else {
          receiver(result);
        }
      } else if (typeof value === "object" && value instanceof Promise) {
        value.then((i) => receiver(i));
      } else {
        receiver(value);
      }
    }

    // packages/alpinejs/src/directives.js
    var prefixAsString = "x-";
    function prefix(subject = "") {
      return prefixAsString + subject;
    }
    function setPrefix(newPrefix) {
      prefixAsString = newPrefix;
    }
    var directiveHandlers = {};
    function directive(name, callback) {
      directiveHandlers[name] = callback;
      return {
        before(directive2) {
          if (!directiveHandlers[directive2]) {
            console.warn(String.raw`Cannot find directive \`${directive2}\`. \`${name}\` will use the default order of execution`);
            return;
          }
          const pos = directiveOrder.indexOf(directive2);
          directiveOrder.splice(pos >= 0 ? pos : directiveOrder.indexOf("DEFAULT"), 0, name);
        }
      };
    }
    function directiveExists(name) {
      return Object.keys(directiveHandlers).includes(name);
    }
    function directives(el, attributes, originalAttributeOverride) {
      attributes = Array.from(attributes);
      if (el._x_virtualDirectives) {
        let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({ name, value }));
        let staticAttributes = attributesOnly(vAttributes);
        vAttributes = vAttributes.map((attribute) => {
          if (staticAttributes.find((attr) => attr.name === attribute.name)) {
            return {
              name: `x-bind:${attribute.name}`,
              value: `"${attribute.value}"`
            };
          }
          return attribute;
        });
        attributes = attributes.concat(vAttributes);
      }
      let transformedAttributeMap = {};
      let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
      return directives2.map((directive2) => {
        return getDirectiveHandler(el, directive2);
      });
    }
    function attributesOnly(attributes) {
      return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
    }
    var isDeferringHandlers = false;
    var directiveHandlerStacks = /* @__PURE__ */ new Map();
    var currentHandlerStackKey = Symbol();
    function deferHandlingDirectives(callback) {
      isDeferringHandlers = true;
      let key = Symbol();
      currentHandlerStackKey = key;
      directiveHandlerStacks.set(key, []);
      let flushHandlers = () => {
        while (directiveHandlerStacks.get(key).length)
          directiveHandlerStacks.get(key).shift()();
        directiveHandlerStacks.delete(key);
      };
      let stopDeferring = () => {
        isDeferringHandlers = false;
        flushHandlers();
      };
      callback(flushHandlers);
      stopDeferring();
    }
    function getElementBoundUtilities(el) {
      let cleanups = [];
      let cleanup2 = (callback) => cleanups.push(callback);
      let [effect3, cleanupEffect] = elementBoundEffect(el);
      cleanups.push(cleanupEffect);
      let utilities = {
        Alpine: alpine_default,
        effect: effect3,
        cleanup: cleanup2,
        evaluateLater: evaluateLater.bind(evaluateLater, el),
        evaluate: evaluate.bind(evaluate, el)
      };
      let doCleanup = () => cleanups.forEach((i) => i());
      return [utilities, doCleanup];
    }
    function getDirectiveHandler(el, directive2) {
      let noop = () => {
      };
      let handler4 = directiveHandlers[directive2.type] || noop;
      let [utilities, cleanup2] = getElementBoundUtilities(el);
      onAttributeRemoved(el, directive2.original, cleanup2);
      let fullHandler = () => {
        if (el._x_ignore || el._x_ignoreSelf)
          return;
        handler4.inline && handler4.inline(el, directive2, utilities);
        handler4 = handler4.bind(handler4, el, directive2, utilities);
        isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler4) : handler4();
      };
      fullHandler.runCleanups = cleanup2;
      return fullHandler;
    }
    var startingWith = (subject, replacement) => ({ name, value }) => {
      if (name.startsWith(subject))
        name = name.replace(subject, replacement);
      return { name, value };
    };
    var into = (i) => i;
    function toTransformedAttributes(callback = () => {
    }) {
      return ({ name, value }) => {
        let { name: newName, value: newValue } = attributeTransformers.reduce((carry, transform) => {
          return transform(carry);
        }, { name, value });
        if (newName !== name)
          callback(newName, name);
        return { name: newName, value: newValue };
      };
    }
    var attributeTransformers = [];
    function mapAttributes(callback) {
      attributeTransformers.push(callback);
    }
    function outNonAlpineAttributes({ name }) {
      return alpineAttributeRegex().test(name);
    }
    var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
    function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
      return ({ name, value }) => {
        let typeMatch = name.match(alpineAttributeRegex());
        let valueMatch = name.match(/:([a-zA-Z0-9\-_:]+)/);
        let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
        let original = originalAttributeOverride || transformedAttributeMap[name] || name;
        return {
          type: typeMatch ? typeMatch[1] : null,
          value: valueMatch ? valueMatch[1] : null,
          modifiers: modifiers.map((i) => i.replace(".", "")),
          expression: value,
          original
        };
      };
    }
    var DEFAULT = "DEFAULT";
    var directiveOrder = [
      "ignore",
      "ref",
      "data",
      "id",
      "anchor",
      "bind",
      "init",
      "for",
      "model",
      "modelable",
      "transition",
      "show",
      "if",
      DEFAULT,
      "teleport"
    ];
    function byPriority(a, b) {
      let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
      let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
      return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
    }

    // packages/alpinejs/src/utils/dispatch.js
    function dispatch(el, name, detail = {}) {
      el.dispatchEvent(
        new CustomEvent(name, {
          detail,
          bubbles: true,
          // Allows events to pass the shadow DOM barrier.
          composed: true,
          cancelable: true
        })
      );
    }

    // packages/alpinejs/src/utils/walk.js
    function walk(el, callback) {
      if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
        Array.from(el.children).forEach((el2) => walk(el2, callback));
        return;
      }
      let skip = false;
      callback(el, () => skip = true);
      if (skip)
        return;
      let node = el.firstElementChild;
      while (node) {
        walk(node, callback);
        node = node.nextElementSibling;
      }
    }

    // packages/alpinejs/src/utils/warn.js
    function warn(message, ...args) {
      console.warn(`Alpine Warning: ${message}`, ...args);
    }

    // packages/alpinejs/src/lifecycle.js
    var started = false;
    function start() {
      if (started)
        warn("Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems.");
      started = true;
      if (!document.body)
        warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
      dispatch(document, "alpine:init");
      dispatch(document, "alpine:initializing");
      startObservingMutations();
      onElAdded((el) => initTree(el, walk));
      onElRemoved((el) => destroyTree(el));
      onAttributesAdded((el, attrs) => {
        directives(el, attrs).forEach((handle) => handle());
      });
      let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
      Array.from(document.querySelectorAll(allSelectors().join(","))).filter(outNestedComponents).forEach((el) => {
        initTree(el);
      });
      dispatch(document, "alpine:initialized");
      setTimeout(() => {
        warnAboutMissingPlugins();
      });
    }
    var rootSelectorCallbacks = [];
    var initSelectorCallbacks = [];
    function rootSelectors() {
      return rootSelectorCallbacks.map((fn) => fn());
    }
    function allSelectors() {
      return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
    }
    function addRootSelector(selectorCallback) {
      rootSelectorCallbacks.push(selectorCallback);
    }
    function addInitSelector(selectorCallback) {
      initSelectorCallbacks.push(selectorCallback);
    }
    function closestRoot(el, includeInitSelectors = false) {
      return findClosest(el, (element) => {
        const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
        if (selectors.some((selector) => element.matches(selector)))
          return true;
      });
    }
    function findClosest(el, callback) {
      if (!el)
        return;
      if (callback(el))
        return el;
      if (el._x_teleportBack)
        el = el._x_teleportBack;
      if (!el.parentElement)
        return;
      return findClosest(el.parentElement, callback);
    }
    function isRoot(el) {
      return rootSelectors().some((selector) => el.matches(selector));
    }
    var initInterceptors2 = [];
    function interceptInit(callback) {
      initInterceptors2.push(callback);
    }
    var markerDispenser = 1;
    function initTree(el, walker = walk, intercept = () => {
    }) {
      if (findClosest(el, (i) => i._x_ignore))
        return;
      deferHandlingDirectives(() => {
        walker(el, (el2, skip) => {
          if (el2._x_marker)
            return;
          intercept(el2, skip);
          initInterceptors2.forEach((i) => i(el2, skip));
          directives(el2, el2.attributes).forEach((handle) => handle());
          if (!el2._x_ignore)
            el2._x_marker = markerDispenser++;
          el2._x_ignore && skip();
        });
      });
    }
    function destroyTree(root, walker = walk) {
      walker(root, (el) => {
        cleanupElement(el);
        cleanupAttributes(el);
        delete el._x_marker;
      });
    }
    function warnAboutMissingPlugins() {
      let pluginDirectives = [
        ["ui", "dialog", ["[x-dialog], [x-popover]"]],
        ["anchor", "anchor", ["[x-anchor]"]],
        ["sort", "sort", ["[x-sort]"]]
      ];
      pluginDirectives.forEach(([plugin2, directive2, selectors]) => {
        if (directiveExists(directive2))
          return;
        selectors.some((selector) => {
          if (document.querySelector(selector)) {
            warn(`found "${selector}", but missing ${plugin2} plugin`);
            return true;
          }
        });
      });
    }

    // packages/alpinejs/src/nextTick.js
    var tickStack = [];
    var isHolding = false;
    function nextTick(callback = () => {
    }) {
      queueMicrotask(() => {
        isHolding || setTimeout(() => {
          releaseNextTicks();
        });
      });
      return new Promise((res) => {
        tickStack.push(() => {
          callback();
          res();
        });
      });
    }
    function releaseNextTicks() {
      isHolding = false;
      while (tickStack.length)
        tickStack.shift()();
    }
    function holdNextTicks() {
      isHolding = true;
    }

    // packages/alpinejs/src/utils/classes.js
    function setClasses(el, value) {
      if (Array.isArray(value)) {
        return setClassesFromString(el, value.join(" "));
      } else if (typeof value === "object" && value !== null) {
        return setClassesFromObject(el, value);
      } else if (typeof value === "function") {
        return setClasses(el, value());
      }
      return setClassesFromString(el, value);
    }
    function setClassesFromString(el, classString) {
      let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
      let addClassesAndReturnUndo = (classes) => {
        el.classList.add(...classes);
        return () => {
          el.classList.remove(...classes);
        };
      };
      classString = classString === true ? classString = "" : classString || "";
      return addClassesAndReturnUndo(missingClasses(classString));
    }
    function setClassesFromObject(el, classObject) {
      let split = (classString) => classString.split(" ").filter(Boolean);
      let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
      let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
      let added = [];
      let removed = [];
      forRemove.forEach((i) => {
        if (el.classList.contains(i)) {
          el.classList.remove(i);
          removed.push(i);
        }
      });
      forAdd.forEach((i) => {
        if (!el.classList.contains(i)) {
          el.classList.add(i);
          added.push(i);
        }
      });
      return () => {
        removed.forEach((i) => el.classList.add(i));
        added.forEach((i) => el.classList.remove(i));
      };
    }

    // packages/alpinejs/src/utils/styles.js
    function setStyles(el, value) {
      if (typeof value === "object" && value !== null) {
        return setStylesFromObject(el, value);
      }
      return setStylesFromString(el, value);
    }
    function setStylesFromObject(el, value) {
      let previousStyles = {};
      Object.entries(value).forEach(([key, value2]) => {
        previousStyles[key] = el.style[key];
        if (!key.startsWith("--")) {
          key = kebabCase(key);
        }
        el.style.setProperty(key, value2);
      });
      setTimeout(() => {
        if (el.style.length === 0) {
          el.removeAttribute("style");
        }
      });
      return () => {
        setStyles(el, previousStyles);
      };
    }
    function setStylesFromString(el, value) {
      let cache = el.getAttribute("style", value);
      el.setAttribute("style", value);
      return () => {
        el.setAttribute("style", cache || "");
      };
    }
    function kebabCase(subject) {
      return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    }

    // packages/alpinejs/src/utils/once.js
    function once(callback, fallback = () => {
    }) {
      let called = false;
      return function() {
        if (!called) {
          called = true;
          callback.apply(this, arguments);
        } else {
          fallback.apply(this, arguments);
        }
      };
    }

    // packages/alpinejs/src/directives/x-transition.js
    directive("transition", (el, { value, modifiers, expression }, { evaluate: evaluate2 }) => {
      if (typeof expression === "function")
        expression = evaluate2(expression);
      if (expression === false)
        return;
      if (!expression || typeof expression === "boolean") {
        registerTransitionsFromHelper(el, modifiers, value);
      } else {
        registerTransitionsFromClassString(el, expression, value);
      }
    });
    function registerTransitionsFromClassString(el, classString, stage) {
      registerTransitionObject(el, setClasses, "");
      let directiveStorageMap = {
        "enter": (classes) => {
          el._x_transition.enter.during = classes;
        },
        "enter-start": (classes) => {
          el._x_transition.enter.start = classes;
        },
        "enter-end": (classes) => {
          el._x_transition.enter.end = classes;
        },
        "leave": (classes) => {
          el._x_transition.leave.during = classes;
        },
        "leave-start": (classes) => {
          el._x_transition.leave.start = classes;
        },
        "leave-end": (classes) => {
          el._x_transition.leave.end = classes;
        }
      };
      directiveStorageMap[stage](classString);
    }
    function registerTransitionsFromHelper(el, modifiers, stage) {
      registerTransitionObject(el, setStyles);
      let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
      let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
      let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
      if (modifiers.includes("in") && !doesntSpecify) {
        modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
      }
      if (modifiers.includes("out") && !doesntSpecify) {
        modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
      }
      let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
      let wantsOpacity = wantsAll || modifiers.includes("opacity");
      let wantsScale = wantsAll || modifiers.includes("scale");
      let opacityValue = wantsOpacity ? 0 : 1;
      let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
      let delay = modifierValue(modifiers, "delay", 0) / 1e3;
      let origin = modifierValue(modifiers, "origin", "center");
      let property = "opacity, transform";
      let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
      let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
      let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
      if (transitioningIn) {
        el._x_transition.enter.during = {
          transformOrigin: origin,
          transitionDelay: `${delay}s`,
          transitionProperty: property,
          transitionDuration: `${durationIn}s`,
          transitionTimingFunction: easing
        };
        el._x_transition.enter.start = {
          opacity: opacityValue,
          transform: `scale(${scaleValue})`
        };
        el._x_transition.enter.end = {
          opacity: 1,
          transform: `scale(1)`
        };
      }
      if (transitioningOut) {
        el._x_transition.leave.during = {
          transformOrigin: origin,
          transitionDelay: `${delay}s`,
          transitionProperty: property,
          transitionDuration: `${durationOut}s`,
          transitionTimingFunction: easing
        };
        el._x_transition.leave.start = {
          opacity: 1,
          transform: `scale(1)`
        };
        el._x_transition.leave.end = {
          opacity: opacityValue,
          transform: `scale(${scaleValue})`
        };
      }
    }
    function registerTransitionObject(el, setFunction, defaultValue = {}) {
      if (!el._x_transition)
        el._x_transition = {
          enter: { during: defaultValue, start: defaultValue, end: defaultValue },
          leave: { during: defaultValue, start: defaultValue, end: defaultValue },
          in(before = () => {
          }, after = () => {
          }) {
            transition(el, setFunction, {
              during: this.enter.during,
              start: this.enter.start,
              end: this.enter.end
            }, before, after);
          },
          out(before = () => {
          }, after = () => {
          }) {
            transition(el, setFunction, {
              during: this.leave.during,
              start: this.leave.start,
              end: this.leave.end
            }, before, after);
          }
        };
    }
    window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
      const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
      let clickAwayCompatibleShow = () => nextTick2(show);
      if (value) {
        if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
          el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
        } else {
          el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
        }
        return;
      }
      el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
        el._x_transition.out(() => {
        }, () => resolve(hide));
        el._x_transitioning && el._x_transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }));
      }) : Promise.resolve(hide);
      queueMicrotask(() => {
        let closest = closestHide(el);
        if (closest) {
          if (!closest._x_hideChildren)
            closest._x_hideChildren = [];
          closest._x_hideChildren.push(el);
        } else {
          nextTick2(() => {
            let hideAfterChildren = (el2) => {
              let carry = Promise.all([
                el2._x_hidePromise,
                ...(el2._x_hideChildren || []).map(hideAfterChildren)
              ]).then(([i]) => i?.());
              delete el2._x_hidePromise;
              delete el2._x_hideChildren;
              return carry;
            };
            hideAfterChildren(el).catch((e) => {
              if (!e.isFromCancelledTransition)
                throw e;
            });
          });
        }
      });
    };
    function closestHide(el) {
      let parent = el.parentNode;
      if (!parent)
        return;
      return parent._x_hidePromise ? parent : closestHide(parent);
    }
    function transition(el, setFunction, { during, start: start2, end } = {}, before = () => {
    }, after = () => {
    }) {
      if (el._x_transitioning)
        el._x_transitioning.cancel();
      if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
        before();
        after();
        return;
      }
      let undoStart, undoDuring, undoEnd;
      performTransition(el, {
        start() {
          undoStart = setFunction(el, start2);
        },
        during() {
          undoDuring = setFunction(el, during);
        },
        before,
        end() {
          undoStart();
          undoEnd = setFunction(el, end);
        },
        after,
        cleanup() {
          undoDuring();
          undoEnd();
        }
      });
    }
    function performTransition(el, stages) {
      let interrupted, reachedBefore, reachedEnd;
      let finish = once(() => {
        mutateDom(() => {
          interrupted = true;
          if (!reachedBefore)
            stages.before();
          if (!reachedEnd) {
            stages.end();
            releaseNextTicks();
          }
          stages.after();
          if (el.isConnected)
            stages.cleanup();
          delete el._x_transitioning;
        });
      });
      el._x_transitioning = {
        beforeCancels: [],
        beforeCancel(callback) {
          this.beforeCancels.push(callback);
        },
        cancel: once(function() {
          while (this.beforeCancels.length) {
            this.beforeCancels.shift()();
          }
          finish();
        }),
        finish
      };
      mutateDom(() => {
        stages.start();
        stages.during();
      });
      holdNextTicks();
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
        let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
        if (duration === 0)
          duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
        mutateDom(() => {
          stages.before();
        });
        reachedBefore = true;
        requestAnimationFrame(() => {
          if (interrupted)
            return;
          mutateDom(() => {
            stages.end();
          });
          releaseNextTicks();
          setTimeout(el._x_transitioning.finish, duration + delay);
          reachedEnd = true;
        });
      });
    }
    function modifierValue(modifiers, key, fallback) {
      if (modifiers.indexOf(key) === -1)
        return fallback;
      const rawValue = modifiers[modifiers.indexOf(key) + 1];
      if (!rawValue)
        return fallback;
      if (key === "scale") {
        if (isNaN(rawValue))
          return fallback;
      }
      if (key === "duration" || key === "delay") {
        let match = rawValue.match(/([0-9]+)ms/);
        if (match)
          return match[1];
      }
      if (key === "origin") {
        if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
          return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
        }
      }
      return rawValue;
    }

    // packages/alpinejs/src/clone.js
    var isCloning = false;
    function skipDuringClone(callback, fallback = () => {
    }) {
      return (...args) => isCloning ? fallback(...args) : callback(...args);
    }
    function onlyDuringClone(callback) {
      return (...args) => isCloning && callback(...args);
    }
    var interceptors = [];
    function interceptClone(callback) {
      interceptors.push(callback);
    }
    function cloneNode(from, to) {
      interceptors.forEach((i) => i(from, to));
      isCloning = true;
      dontRegisterReactiveSideEffects(() => {
        initTree(to, (el, callback) => {
          callback(el, () => {
          });
        });
      });
      isCloning = false;
    }
    var isCloningLegacy = false;
    function clone$1(oldEl, newEl) {
      if (!newEl._x_dataStack)
        newEl._x_dataStack = oldEl._x_dataStack;
      isCloning = true;
      isCloningLegacy = true;
      dontRegisterReactiveSideEffects(() => {
        cloneTree(newEl);
      });
      isCloning = false;
      isCloningLegacy = false;
    }
    function cloneTree(el) {
      let hasRunThroughFirstEl = false;
      let shallowWalker = (el2, callback) => {
        walk(el2, (el3, skip) => {
          if (hasRunThroughFirstEl && isRoot(el3))
            return skip();
          hasRunThroughFirstEl = true;
          callback(el3, skip);
        });
      };
      initTree(el, shallowWalker);
    }
    function dontRegisterReactiveSideEffects(callback) {
      let cache = effect;
      overrideEffect((callback2, el) => {
        let storedEffect = cache(callback2);
        release(storedEffect);
        return () => {
        };
      });
      callback();
      overrideEffect(cache);
    }

    // packages/alpinejs/src/utils/bind.js
    function bind(el, name, value, modifiers = []) {
      if (!el._x_bindings)
        el._x_bindings = reactive({});
      el._x_bindings[name] = value;
      name = modifiers.includes("camel") ? camelCase(name) : name;
      switch (name) {
        case "value":
          bindInputValue(el, value);
          break;
        case "style":
          bindStyles(el, value);
          break;
        case "class":
          bindClasses(el, value);
          break;
        case "selected":
        case "checked":
          bindAttributeAndProperty(el, name, value);
          break;
        default:
          bindAttribute(el, name, value);
          break;
      }
    }
    function bindInputValue(el, value) {
      if (isRadio(el)) {
        if (el.attributes.value === void 0) {
          el.value = value;
        }
        if (window.fromModel) {
          if (typeof value === "boolean") {
            el.checked = safeParseBoolean(el.value) === value;
          } else {
            el.checked = checkedAttrLooseCompare(el.value, value);
          }
        }
      } else if (isCheckbox(el)) {
        if (Number.isInteger(value)) {
          el.value = value;
        } else if (!Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
          el.value = String(value);
        } else {
          if (Array.isArray(value)) {
            el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
          } else {
            el.checked = !!value;
          }
        }
      } else if (el.tagName === "SELECT") {
        updateSelect(el, value);
      } else {
        if (el.value === value)
          return;
        el.value = value === void 0 ? "" : value;
      }
    }
    function bindClasses(el, value) {
      if (el._x_undoAddedClasses)
        el._x_undoAddedClasses();
      el._x_undoAddedClasses = setClasses(el, value);
    }
    function bindStyles(el, value) {
      if (el._x_undoAddedStyles)
        el._x_undoAddedStyles();
      el._x_undoAddedStyles = setStyles(el, value);
    }
    function bindAttributeAndProperty(el, name, value) {
      bindAttribute(el, name, value);
      setPropertyIfChanged(el, name, value);
    }
    function bindAttribute(el, name, value) {
      if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
        el.removeAttribute(name);
      } else {
        if (isBooleanAttr(name))
          value = name;
        setIfChanged(el, name, value);
      }
    }
    function setIfChanged(el, attrName, value) {
      if (el.getAttribute(attrName) != value) {
        el.setAttribute(attrName, value);
      }
    }
    function setPropertyIfChanged(el, propName, value) {
      if (el[propName] !== value) {
        el[propName] = value;
      }
    }
    function updateSelect(el, value) {
      const arrayWrappedValue = [].concat(value).map((value2) => {
        return value2 + "";
      });
      Array.from(el.options).forEach((option) => {
        option.selected = arrayWrappedValue.includes(option.value);
      });
    }
    function camelCase(subject) {
      return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
    }
    function checkedAttrLooseCompare(valueA, valueB) {
      return valueA == valueB;
    }
    function safeParseBoolean(rawValue) {
      if ([1, "1", "true", "on", "yes", true].includes(rawValue)) {
        return true;
      }
      if ([0, "0", "false", "off", "no", false].includes(rawValue)) {
        return false;
      }
      return rawValue ? Boolean(rawValue) : null;
    }
    var booleanAttributes = /* @__PURE__ */ new Set([
      "allowfullscreen",
      "async",
      "autofocus",
      "autoplay",
      "checked",
      "controls",
      "default",
      "defer",
      "disabled",
      "formnovalidate",
      "inert",
      "ismap",
      "itemscope",
      "loop",
      "multiple",
      "muted",
      "nomodule",
      "novalidate",
      "open",
      "playsinline",
      "readonly",
      "required",
      "reversed",
      "selected",
      "shadowrootclonable",
      "shadowrootdelegatesfocus",
      "shadowrootserializable"
    ]);
    function isBooleanAttr(attrName) {
      return booleanAttributes.has(attrName);
    }
    function attributeShouldntBePreservedIfFalsy(name) {
      return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
    }
    function getBinding(el, name, fallback) {
      if (el._x_bindings && el._x_bindings[name] !== void 0)
        return el._x_bindings[name];
      return getAttributeBinding(el, name, fallback);
    }
    function extractProp(el, name, fallback, extract = true) {
      if (el._x_bindings && el._x_bindings[name] !== void 0)
        return el._x_bindings[name];
      if (el._x_inlineBindings && el._x_inlineBindings[name] !== void 0) {
        let binding = el._x_inlineBindings[name];
        binding.extract = extract;
        return dontAutoEvaluateFunctions(() => {
          return evaluate(el, binding.expression);
        });
      }
      return getAttributeBinding(el, name, fallback);
    }
    function getAttributeBinding(el, name, fallback) {
      let attr = el.getAttribute(name);
      if (attr === null)
        return typeof fallback === "function" ? fallback() : fallback;
      if (attr === "")
        return true;
      if (isBooleanAttr(name)) {
        return !![name, "true"].includes(attr);
      }
      return attr;
    }
    function isCheckbox(el) {
      return el.type === "checkbox" || el.localName === "ui-checkbox" || el.localName === "ui-switch";
    }
    function isRadio(el) {
      return el.type === "radio" || el.localName === "ui-radio";
    }

    // packages/alpinejs/src/utils/debounce.js
    function debounce(func, wait) {
      let timeout;
      return function() {
        const context = this, args = arguments;
        const later = function() {
          timeout = null;
          func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // packages/alpinejs/src/utils/throttle.js
    function throttle(func, limit) {
      let inThrottle;
      return function() {
        let context = this, args = arguments;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }

    // packages/alpinejs/src/entangle.js
    function entangle({ get: outerGet, set: outerSet }, { get: innerGet, set: innerSet }) {
      let firstRun = true;
      let outerHash;
      let reference = effect(() => {
        let outer = outerGet();
        let inner = innerGet();
        if (firstRun) {
          innerSet(cloneIfObject(outer));
          firstRun = false;
        } else {
          let outerHashLatest = JSON.stringify(outer);
          let innerHashLatest = JSON.stringify(inner);
          if (outerHashLatest !== outerHash) {
            innerSet(cloneIfObject(outer));
          } else if (outerHashLatest !== innerHashLatest) {
            outerSet(cloneIfObject(inner));
          } else ;
        }
        outerHash = JSON.stringify(outerGet());
        JSON.stringify(innerGet());
      });
      return () => {
        release(reference);
      };
    }
    function cloneIfObject(value) {
      return typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
    }

    // packages/alpinejs/src/plugin.js
    function plugin(callback) {
      let callbacks = Array.isArray(callback) ? callback : [callback];
      callbacks.forEach((i) => i(alpine_default));
    }

    // packages/alpinejs/src/store.js
    var stores = {};
    var isReactive = false;
    function store(name, value) {
      if (!isReactive) {
        stores = reactive(stores);
        isReactive = true;
      }
      if (value === void 0) {
        return stores[name];
      }
      stores[name] = value;
      initInterceptors(stores[name]);
      if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
        stores[name].init();
      }
    }
    function getStores() {
      return stores;
    }

    // packages/alpinejs/src/binds.js
    var binds = {};
    function bind2(name, bindings) {
      let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
      if (name instanceof Element) {
        return applyBindingsObject(name, getBindings());
      } else {
        binds[name] = getBindings;
      }
      return () => {
      };
    }
    function injectBindingProviders(obj) {
      Object.entries(binds).forEach(([name, callback]) => {
        Object.defineProperty(obj, name, {
          get() {
            return (...args) => {
              return callback(...args);
            };
          }
        });
      });
      return obj;
    }
    function applyBindingsObject(el, obj, original) {
      let cleanupRunners = [];
      while (cleanupRunners.length)
        cleanupRunners.pop()();
      let attributes = Object.entries(obj).map(([name, value]) => ({ name, value }));
      let staticAttributes = attributesOnly(attributes);
      attributes = attributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`
          };
        }
        return attribute;
      });
      directives(el, attributes, original).map((handle) => {
        cleanupRunners.push(handle.runCleanups);
        handle();
      });
      return () => {
        while (cleanupRunners.length)
          cleanupRunners.pop()();
      };
    }

    // packages/alpinejs/src/datas.js
    var datas = {};
    function data(name, callback) {
      datas[name] = callback;
    }
    function injectDataProviders(obj, context) {
      Object.entries(datas).forEach(([name, callback]) => {
        Object.defineProperty(obj, name, {
          get() {
            return (...args) => {
              return callback.bind(context)(...args);
            };
          },
          enumerable: false
        });
      });
      return obj;
    }

    // packages/alpinejs/src/alpine.js
    var Alpine = {
      get reactive() {
        return reactive;
      },
      get release() {
        return release;
      },
      get effect() {
        return effect;
      },
      get raw() {
        return raw;
      },
      version: "3.15.0",
      flushAndStopDeferringMutations,
      dontAutoEvaluateFunctions,
      disableEffectScheduling,
      startObservingMutations,
      stopObservingMutations,
      setReactivityEngine,
      onAttributeRemoved,
      onAttributesAdded,
      closestDataStack,
      skipDuringClone,
      onlyDuringClone,
      addRootSelector,
      addInitSelector,
      interceptClone,
      addScopeToNode,
      deferMutations,
      mapAttributes,
      evaluateLater,
      interceptInit,
      setEvaluator,
      mergeProxies,
      extractProp,
      findClosest,
      onElRemoved,
      closestRoot,
      destroyTree,
      interceptor,
      // INTERNAL: not public API and is subject to change without major release.
      transition,
      // INTERNAL
      setStyles,
      // INTERNAL
      mutateDom,
      directive,
      entangle,
      throttle,
      debounce,
      evaluate,
      initTree,
      nextTick,
      prefixed: prefix,
      prefix: setPrefix,
      plugin,
      magic,
      store,
      start,
      clone: clone$1,
      // INTERNAL
      cloneNode,
      // INTERNAL
      bound: getBinding,
      $data: scope,
      watch,
      walk,
      data,
      bind: bind2
    };
    var alpine_default = Alpine;

    // node_modules/@vue/shared/dist/shared.esm-bundler.js
    function makeMap(str, expectsLowerCase) {
      const map = /* @__PURE__ */ Object.create(null);
      const list = str.split(",");
      for (let i = 0; i < list.length; i++) {
        map[list[i]] = true;
      }
      return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
    }
    var EMPTY_OBJ = Object.freeze({}) ;
    Object.freeze([]) ;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var hasOwn = (val, key) => hasOwnProperty.call(val, key);
    var isArray = Array.isArray;
    var isMap = (val) => toTypeString(val) === "[object Map]";
    var isString = (val) => typeof val === "string";
    var isSymbol = (val) => typeof val === "symbol";
    var isObject = (val) => val !== null && typeof val === "object";
    var objectToString = Object.prototype.toString;
    var toTypeString = (value) => objectToString.call(value);
    var toRawType = (value) => {
      return toTypeString(value).slice(8, -1);
    };
    var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
    var cacheStringFunction = (fn) => {
      const cache = /* @__PURE__ */ Object.create(null);
      return (str) => {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
      };
    };
    var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
    var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);

    // node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
    var targetMap = /* @__PURE__ */ new WeakMap();
    var effectStack = [];
    var activeEffect;
    var ITERATE_KEY = Symbol("iterate" );
    var MAP_KEY_ITERATE_KEY = Symbol("Map key iterate" );
    function isEffect(fn) {
      return fn && fn._isEffect === true;
    }
    function effect2(fn, options = EMPTY_OBJ) {
      if (isEffect(fn)) {
        fn = fn.raw;
      }
      const effect3 = createReactiveEffect(fn, options);
      if (!options.lazy) {
        effect3();
      }
      return effect3;
    }
    function stop(effect3) {
      if (effect3.active) {
        cleanup(effect3);
        if (effect3.options.onStop) {
          effect3.options.onStop();
        }
        effect3.active = false;
      }
    }
    var uid = 0;
    function createReactiveEffect(fn, options) {
      const effect3 = function reactiveEffect() {
        if (!effect3.active) {
          return fn();
        }
        if (!effectStack.includes(effect3)) {
          cleanup(effect3);
          try {
            enableTracking();
            effectStack.push(effect3);
            activeEffect = effect3;
            return fn();
          } finally {
            effectStack.pop();
            resetTracking();
            activeEffect = effectStack[effectStack.length - 1];
          }
        }
      };
      effect3.id = uid++;
      effect3.allowRecurse = !!options.allowRecurse;
      effect3._isEffect = true;
      effect3.active = true;
      effect3.raw = fn;
      effect3.deps = [];
      effect3.options = options;
      return effect3;
    }
    function cleanup(effect3) {
      const { deps } = effect3;
      if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
          deps[i].delete(effect3);
        }
        deps.length = 0;
      }
    }
    var shouldTrack = true;
    var trackStack = [];
    function pauseTracking() {
      trackStack.push(shouldTrack);
      shouldTrack = false;
    }
    function enableTracking() {
      trackStack.push(shouldTrack);
      shouldTrack = true;
    }
    function resetTracking() {
      const last = trackStack.pop();
      shouldTrack = last === void 0 ? true : last;
    }
    function track(target, type, key) {
      if (!shouldTrack || activeEffect === void 0) {
        return;
      }
      let depsMap = targetMap.get(target);
      if (!depsMap) {
        targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
      }
      let dep = depsMap.get(key);
      if (!dep) {
        depsMap.set(key, dep = /* @__PURE__ */ new Set());
      }
      if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
        if (activeEffect.options.onTrack) {
          activeEffect.options.onTrack({
            effect: activeEffect,
            target,
            type,
            key
          });
        }
      }
    }
    function trigger(target, type, key, newValue, oldValue, oldTarget) {
      const depsMap = targetMap.get(target);
      if (!depsMap) {
        return;
      }
      const effects = /* @__PURE__ */ new Set();
      const add2 = (effectsToAdd) => {
        if (effectsToAdd) {
          effectsToAdd.forEach((effect3) => {
            if (effect3 !== activeEffect || effect3.allowRecurse) {
              effects.add(effect3);
            }
          });
        }
      };
      if (type === "clear") {
        depsMap.forEach(add2);
      } else if (key === "length" && isArray(target)) {
        depsMap.forEach((dep, key2) => {
          if (key2 === "length" || key2 >= newValue) {
            add2(dep);
          }
        });
      } else {
        if (key !== void 0) {
          add2(depsMap.get(key));
        }
        switch (type) {
          case "add":
            if (!isArray(target)) {
              add2(depsMap.get(ITERATE_KEY));
              if (isMap(target)) {
                add2(depsMap.get(MAP_KEY_ITERATE_KEY));
              }
            } else if (isIntegerKey(key)) {
              add2(depsMap.get("length"));
            }
            break;
          case "delete":
            if (!isArray(target)) {
              add2(depsMap.get(ITERATE_KEY));
              if (isMap(target)) {
                add2(depsMap.get(MAP_KEY_ITERATE_KEY));
              }
            }
            break;
          case "set":
            if (isMap(target)) {
              add2(depsMap.get(ITERATE_KEY));
            }
            break;
        }
      }
      const run = (effect3) => {
        if (effect3.options.onTrigger) {
          effect3.options.onTrigger({
            effect: effect3,
            target,
            key,
            type,
            newValue,
            oldValue,
            oldTarget
          });
        }
        if (effect3.options.scheduler) {
          effect3.options.scheduler(effect3);
        } else {
          effect3();
        }
      };
      effects.forEach(run);
    }
    var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
    var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
    var get2 = /* @__PURE__ */ createGetter();
    var readonlyGet = /* @__PURE__ */ createGetter(true);
    var arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
    function createArrayInstrumentations() {
      const instrumentations = {};
      ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
        instrumentations[key] = function(...args) {
          const arr = toRaw(this);
          for (let i = 0, l = this.length; i < l; i++) {
            track(arr, "get", i + "");
          }
          const res = arr[key](...args);
          if (res === -1 || res === false) {
            return arr[key](...args.map(toRaw));
          } else {
            return res;
          }
        };
      });
      ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
        instrumentations[key] = function(...args) {
          pauseTracking();
          const res = toRaw(this)[key].apply(this, args);
          resetTracking();
          return res;
        };
      });
      return instrumentations;
    }
    function createGetter(isReadonly = false, shallow = false) {
      return function get3(target, key, receiver) {
        if (key === "__v_isReactive") {
          return !isReadonly;
        } else if (key === "__v_isReadonly") {
          return isReadonly;
        } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
          return target;
        }
        const targetIsArray = isArray(target);
        if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
          return Reflect.get(arrayInstrumentations, key, receiver);
        }
        const res = Reflect.get(target, key, receiver);
        if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
          return res;
        }
        if (!isReadonly) {
          track(target, "get", key);
        }
        if (shallow) {
          return res;
        }
        if (isRef(res)) {
          const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
          return shouldUnwrap ? res.value : res;
        }
        if (isObject(res)) {
          return isReadonly ? readonly(res) : reactive2(res);
        }
        return res;
      };
    }
    var set2 = /* @__PURE__ */ createSetter();
    function createSetter(shallow = false) {
      return function set3(target, key, value, receiver) {
        let oldValue = target[key];
        if (!shallow) {
          value = toRaw(value);
          oldValue = toRaw(oldValue);
          if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
            oldValue.value = value;
            return true;
          }
        }
        const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        const result = Reflect.set(target, key, value, receiver);
        if (target === toRaw(receiver)) {
          if (!hadKey) {
            trigger(target, "add", key, value);
          } else if (hasChanged(value, oldValue)) {
            trigger(target, "set", key, value, oldValue);
          }
        }
        return result;
      };
    }
    function deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const oldValue = target[key];
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
        trigger(target, "delete", key, void 0, oldValue);
      }
      return result;
    }
    function has(target, key) {
      const result = Reflect.has(target, key);
      if (!isSymbol(key) || !builtInSymbols.has(key)) {
        track(target, "has", key);
      }
      return result;
    }
    function ownKeys(target) {
      track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
      return Reflect.ownKeys(target);
    }
    var mutableHandlers = {
      get: get2,
      set: set2,
      deleteProperty,
      has,
      ownKeys
    };
    var readonlyHandlers = {
      get: readonlyGet,
      set(target, key) {
        {
          console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        }
        return true;
      },
      deleteProperty(target, key) {
        {
          console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
        }
        return true;
      }
    };
    var toReactive = (value) => isObject(value) ? reactive2(value) : value;
    var toReadonly = (value) => isObject(value) ? readonly(value) : value;
    var toShallow = (value) => value;
    var getProto = (v) => Reflect.getPrototypeOf(v);
    function get$1(target, key, isReadonly = false, isShallow = false) {
      target = target[
        "__v_raw"
        /* RAW */
      ];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (key !== rawKey) {
        !isReadonly && track(rawTarget, "get", key);
      }
      !isReadonly && track(rawTarget, "get", rawKey);
      const { has: has2 } = getProto(rawTarget);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      if (has2.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has2.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    }
    function has$1(key, isReadonly = false) {
      const target = this[
        "__v_raw"
        /* RAW */
      ];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (key !== rawKey) {
        !isReadonly && track(rawTarget, "has", key);
      }
      !isReadonly && track(rawTarget, "has", rawKey);
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    }
    function size(target, isReadonly = false) {
      target = target[
        "__v_raw"
        /* RAW */
      ];
      !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
      return Reflect.get(target, "size", target);
    }
    function add(value) {
      value = toRaw(value);
      const target = toRaw(this);
      const proto = getProto(target);
      const hadKey = proto.has.call(target, value);
      if (!hadKey) {
        target.add(value);
        trigger(target, "add", value, value);
      }
      return this;
    }
    function set$1(key, value) {
      value = toRaw(value);
      const target = toRaw(this);
      const { has: has2, get: get3 } = getProto(target);
      let hadKey = has2.call(target, key);
      if (!hadKey) {
        key = toRaw(key);
        hadKey = has2.call(target, key);
      } else {
        checkIdentityKeys(target, has2, key);
      }
      const oldValue = get3.call(target, key);
      target.set(key, value);
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value, oldValue);
      }
      return this;
    }
    function deleteEntry(key) {
      const target = toRaw(this);
      const { has: has2, get: get3 } = getProto(target);
      let hadKey = has2.call(target, key);
      if (!hadKey) {
        key = toRaw(key);
        hadKey = has2.call(target, key);
      } else {
        checkIdentityKeys(target, has2, key);
      }
      const oldValue = get3 ? get3.call(target, key) : void 0;
      const result = target.delete(key);
      if (hadKey) {
        trigger(target, "delete", key, void 0, oldValue);
      }
      return result;
    }
    function clear() {
      const target = toRaw(this);
      const hadItems = target.size !== 0;
      const oldTarget = isMap(target) ? new Map(target) : new Set(target) ;
      const result = target.clear();
      if (hadItems) {
        trigger(target, "clear", void 0, void 0, oldTarget);
      }
      return result;
    }
    function createForEach(isReadonly, isShallow) {
      return function forEach(callback, thisArg) {
        const observed = this;
        const target = observed[
          "__v_raw"
          /* RAW */
        ];
        const rawTarget = toRaw(target);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
        return target.forEach((value, key) => {
          return callback.call(thisArg, wrap(value), wrap(key), observed);
        });
      };
    }
    function createIterableMethod(method, isReadonly, isShallow) {
      return function(...args) {
        const target = this[
          "__v_raw"
          /* RAW */
        ];
        const rawTarget = toRaw(target);
        const targetIsMap = isMap(rawTarget);
        const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
        const isKeyOnly = method === "keys" && targetIsMap;
        const innerIterator = target[method](...args);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
        return {
          // iterator protocol
          next() {
            const { value, done } = innerIterator.next();
            return done ? { value, done } : {
              value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
              done
            };
          },
          // iterable protocol
          [Symbol.iterator]() {
            return this;
          }
        };
      };
    }
    function createReadonlyMethod(type) {
      return function(...args) {
        {
          const key = args[0] ? `on key "${args[0]}" ` : ``;
          console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
        }
        return type === "delete" ? false : this;
      };
    }
    function createInstrumentations() {
      const mutableInstrumentations2 = {
        get(key) {
          return get$1(this, key);
        },
        get size() {
          return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, false)
      };
      const shallowInstrumentations2 = {
        get(key) {
          return get$1(this, key, false, true);
        },
        get size() {
          return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, true)
      };
      const readonlyInstrumentations2 = {
        get(key) {
          return get$1(this, key, true);
        },
        get size() {
          return size(this, true);
        },
        has(key) {
          return has$1.call(this, key, true);
        },
        add: createReadonlyMethod(
          "add"
          /* ADD */
        ),
        set: createReadonlyMethod(
          "set"
          /* SET */
        ),
        delete: createReadonlyMethod(
          "delete"
          /* DELETE */
        ),
        clear: createReadonlyMethod(
          "clear"
          /* CLEAR */
        ),
        forEach: createForEach(true, false)
      };
      const shallowReadonlyInstrumentations2 = {
        get(key) {
          return get$1(this, key, true, true);
        },
        get size() {
          return size(this, true);
        },
        has(key) {
          return has$1.call(this, key, true);
        },
        add: createReadonlyMethod(
          "add"
          /* ADD */
        ),
        set: createReadonlyMethod(
          "set"
          /* SET */
        ),
        delete: createReadonlyMethod(
          "delete"
          /* DELETE */
        ),
        clear: createReadonlyMethod(
          "clear"
          /* CLEAR */
        ),
        forEach: createForEach(true, true)
      };
      const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
      iteratorMethods.forEach((method) => {
        mutableInstrumentations2[method] = createIterableMethod(method, false, false);
        readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
        shallowInstrumentations2[method] = createIterableMethod(method, false, true);
        shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
      });
      return [
        mutableInstrumentations2,
        readonlyInstrumentations2,
        shallowInstrumentations2,
        shallowReadonlyInstrumentations2
      ];
    }
    var [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
    function createInstrumentationGetter(isReadonly, shallow) {
      const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
      return (target, key, receiver) => {
        if (key === "__v_isReactive") {
          return !isReadonly;
        } else if (key === "__v_isReadonly") {
          return isReadonly;
        } else if (key === "__v_raw") {
          return target;
        }
        return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
      };
    }
    var mutableCollectionHandlers = {
      get: /* @__PURE__ */ createInstrumentationGetter(false, false)
    };
    var readonlyCollectionHandlers = {
      get: /* @__PURE__ */ createInstrumentationGetter(true, false)
    };
    function checkIdentityKeys(target, has2, key) {
      const rawKey = toRaw(key);
      if (rawKey !== key && has2.call(target, rawKey)) {
        const type = toRawType(target);
        console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
      }
    }
    var reactiveMap = /* @__PURE__ */ new WeakMap();
    var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
    var readonlyMap = /* @__PURE__ */ new WeakMap();
    var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
    function targetTypeMap(rawType) {
      switch (rawType) {
        case "Object":
        case "Array":
          return 1;
        case "Map":
        case "Set":
        case "WeakMap":
        case "WeakSet":
          return 2;
        default:
          return 0;
      }
    }
    function getTargetType(value) {
      return value[
        "__v_skip"
        /* SKIP */
      ] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
    }
    function reactive2(target) {
      if (target && target[
        "__v_isReadonly"
        /* IS_READONLY */
      ]) {
        return target;
      }
      return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
    }
    function readonly(target) {
      return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
    }
    function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
      if (!isObject(target)) {
        {
          console.warn(`value cannot be made reactive: ${String(target)}`);
        }
        return target;
      }
      if (target[
        "__v_raw"
        /* RAW */
      ] && !(isReadonly && target[
        "__v_isReactive"
        /* IS_REACTIVE */
      ])) {
        return target;
      }
      const existingProxy = proxyMap.get(target);
      if (existingProxy) {
        return existingProxy;
      }
      const targetType = getTargetType(target);
      if (targetType === 0) {
        return target;
      }
      const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
      proxyMap.set(target, proxy);
      return proxy;
    }
    function toRaw(observed) {
      return observed && toRaw(observed[
        "__v_raw"
        /* RAW */
      ]) || observed;
    }
    function isRef(r) {
      return Boolean(r && r.__v_isRef === true);
    }

    // packages/alpinejs/src/magics/$nextTick.js
    magic("nextTick", () => nextTick);

    // packages/alpinejs/src/magics/$dispatch.js
    magic("dispatch", (el) => dispatch.bind(dispatch, el));

    // packages/alpinejs/src/magics/$watch.js
    magic("watch", (el, { evaluateLater: evaluateLater2, cleanup: cleanup2 }) => (key, callback) => {
      let evaluate2 = evaluateLater2(key);
      let getter = () => {
        let value;
        evaluate2((i) => value = i);
        return value;
      };
      let unwatch = watch(getter, callback);
      cleanup2(unwatch);
    });

    // packages/alpinejs/src/magics/$store.js
    magic("store", getStores);

    // packages/alpinejs/src/magics/$data.js
    magic("data", (el) => scope(el));

    // packages/alpinejs/src/magics/$root.js
    magic("root", (el) => closestRoot(el));

    // packages/alpinejs/src/magics/$refs.js
    magic("refs", (el) => {
      if (el._x_refs_proxy)
        return el._x_refs_proxy;
      el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
      return el._x_refs_proxy;
    });
    function getArrayOfRefObject(el) {
      let refObjects = [];
      findClosest(el, (i) => {
        if (i._x_refs)
          refObjects.push(i._x_refs);
      });
      return refObjects;
    }

    // packages/alpinejs/src/ids.js
    var globalIdMemo = {};
    function findAndIncrementId(name) {
      if (!globalIdMemo[name])
        globalIdMemo[name] = 0;
      return ++globalIdMemo[name];
    }
    function closestIdRoot(el, name) {
      return findClosest(el, (element) => {
        if (element._x_ids && element._x_ids[name])
          return true;
      });
    }
    function setIdRoot(el, name) {
      if (!el._x_ids)
        el._x_ids = {};
      if (!el._x_ids[name])
        el._x_ids[name] = findAndIncrementId(name);
    }

    // packages/alpinejs/src/magics/$id.js
    magic("id", (el, { cleanup: cleanup2 }) => (name, key = null) => {
      let cacheKey = `${name}${key ? `-${key}` : ""}`;
      return cacheIdByNameOnElement(el, cacheKey, cleanup2, () => {
        let root = closestIdRoot(el, name);
        let id = root ? root._x_ids[name] : findAndIncrementId(name);
        return key ? `${name}-${id}-${key}` : `${name}-${id}`;
      });
    });
    interceptClone((from, to) => {
      if (from._x_id) {
        to._x_id = from._x_id;
      }
    });
    function cacheIdByNameOnElement(el, cacheKey, cleanup2, callback) {
      if (!el._x_id)
        el._x_id = {};
      if (el._x_id[cacheKey])
        return el._x_id[cacheKey];
      let output = callback();
      el._x_id[cacheKey] = output;
      cleanup2(() => {
        delete el._x_id[cacheKey];
      });
      return output;
    }

    // packages/alpinejs/src/magics/$el.js
    magic("el", (el) => el);

    // packages/alpinejs/src/magics/index.js
    warnMissingPluginMagic("Focus", "focus", "focus");
    warnMissingPluginMagic("Persist", "persist", "persist");
    function warnMissingPluginMagic(name, magicName, slug) {
      magic(magicName, (el) => warn(`You can't use [$${magicName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
    }

    // packages/alpinejs/src/directives/x-modelable.js
    directive("modelable", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2, cleanup: cleanup2 }) => {
      let func = evaluateLater2(expression);
      let innerGet = () => {
        let result;
        func((i) => result = i);
        return result;
      };
      let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
      let innerSet = (val) => evaluateInnerSet(() => {
      }, { scope: { "__placeholder": val } });
      let initialValue = innerGet();
      innerSet(initialValue);
      queueMicrotask(() => {
        if (!el._x_model)
          return;
        el._x_removeModelListeners["default"]();
        let outerGet = el._x_model.get;
        let outerSet = el._x_model.set;
        let releaseEntanglement = entangle(
          {
            get() {
              return outerGet();
            },
            set(value) {
              outerSet(value);
            }
          },
          {
            get() {
              return innerGet();
            },
            set(value) {
              innerSet(value);
            }
          }
        );
        cleanup2(releaseEntanglement);
      });
    });

    // packages/alpinejs/src/directives/x-teleport.js
    directive("teleport", (el, { modifiers, expression }, { cleanup: cleanup2 }) => {
      if (el.tagName.toLowerCase() !== "template")
        warn("x-teleport can only be used on a <template> tag", el);
      let target = getTarget(expression);
      let clone2 = el.content.cloneNode(true).firstElementChild;
      el._x_teleport = clone2;
      clone2._x_teleportBack = el;
      el.setAttribute("data-teleport-template", true);
      clone2.setAttribute("data-teleport-target", true);
      if (el._x_forwardEvents) {
        el._x_forwardEvents.forEach((eventName) => {
          clone2.addEventListener(eventName, (e) => {
            e.stopPropagation();
            el.dispatchEvent(new e.constructor(e.type, e));
          });
        });
      }
      addScopeToNode(clone2, {}, el);
      let placeInDom = (clone3, target2, modifiers2) => {
        if (modifiers2.includes("prepend")) {
          target2.parentNode.insertBefore(clone3, target2);
        } else if (modifiers2.includes("append")) {
          target2.parentNode.insertBefore(clone3, target2.nextSibling);
        } else {
          target2.appendChild(clone3);
        }
      };
      mutateDom(() => {
        placeInDom(clone2, target, modifiers);
        skipDuringClone(() => {
          initTree(clone2);
        })();
      });
      el._x_teleportPutBack = () => {
        let target2 = getTarget(expression);
        mutateDom(() => {
          placeInDom(el._x_teleport, target2, modifiers);
        });
      };
      cleanup2(
        () => mutateDom(() => {
          clone2.remove();
          destroyTree(clone2);
        })
      );
    });
    var teleportContainerDuringClone = document.createElement("div");
    function getTarget(expression) {
      let target = skipDuringClone(() => {
        return document.querySelector(expression);
      }, () => {
        return teleportContainerDuringClone;
      })();
      if (!target)
        warn(`Cannot find x-teleport element for selector: "${expression}"`);
      return target;
    }

    // packages/alpinejs/src/directives/x-ignore.js
    var handler = () => {
    };
    handler.inline = (el, { modifiers }, { cleanup: cleanup2 }) => {
      modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
      cleanup2(() => {
        modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
      });
    };
    directive("ignore", handler);

    // packages/alpinejs/src/directives/x-effect.js
    directive("effect", skipDuringClone((el, { expression }, { effect: effect3 }) => {
      effect3(evaluateLater(el, expression));
    }));

    // packages/alpinejs/src/utils/on.js
    function on(el, event, modifiers, callback) {
      let listenerTarget = el;
      let handler4 = (e) => callback(e);
      let options = {};
      let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
      if (modifiers.includes("dot"))
        event = dotSyntax(event);
      if (modifiers.includes("camel"))
        event = camelCase2(event);
      if (modifiers.includes("passive"))
        options.passive = true;
      if (modifiers.includes("capture"))
        options.capture = true;
      if (modifiers.includes("window"))
        listenerTarget = window;
      if (modifiers.includes("document"))
        listenerTarget = document;
      if (modifiers.includes("debounce")) {
        let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
        let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
        handler4 = debounce(handler4, wait);
      }
      if (modifiers.includes("throttle")) {
        let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
        let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
        handler4 = throttle(handler4, wait);
      }
      if (modifiers.includes("prevent"))
        handler4 = wrapHandler(handler4, (next, e) => {
          e.preventDefault();
          next(e);
        });
      if (modifiers.includes("stop"))
        handler4 = wrapHandler(handler4, (next, e) => {
          e.stopPropagation();
          next(e);
        });
      if (modifiers.includes("once")) {
        handler4 = wrapHandler(handler4, (next, e) => {
          next(e);
          listenerTarget.removeEventListener(event, handler4, options);
        });
      }
      if (modifiers.includes("away") || modifiers.includes("outside")) {
        listenerTarget = document;
        handler4 = wrapHandler(handler4, (next, e) => {
          if (el.contains(e.target))
            return;
          if (e.target.isConnected === false)
            return;
          if (el.offsetWidth < 1 && el.offsetHeight < 1)
            return;
          if (el._x_isShown === false)
            return;
          next(e);
        });
      }
      if (modifiers.includes("self"))
        handler4 = wrapHandler(handler4, (next, e) => {
          e.target === el && next(e);
        });
      if (isKeyEvent(event) || isClickEvent(event)) {
        handler4 = wrapHandler(handler4, (next, e) => {
          if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
            return;
          }
          next(e);
        });
      }
      listenerTarget.addEventListener(event, handler4, options);
      return () => {
        listenerTarget.removeEventListener(event, handler4, options);
      };
    }
    function dotSyntax(subject) {
      return subject.replace(/-/g, ".");
    }
    function camelCase2(subject) {
      return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
    }
    function isNumeric(subject) {
      return !Array.isArray(subject) && !isNaN(subject);
    }
    function kebabCase2(subject) {
      if ([" ", "_"].includes(
        subject
      ))
        return subject;
      return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
    }
    function isKeyEvent(event) {
      return ["keydown", "keyup"].includes(event);
    }
    function isClickEvent(event) {
      return ["contextmenu", "click", "mouse"].some((i) => event.includes(i));
    }
    function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
      let keyModifiers = modifiers.filter((i) => {
        return !["window", "document", "prevent", "stop", "once", "capture", "self", "away", "outside", "passive", "preserve-scroll"].includes(i);
      });
      if (keyModifiers.includes("debounce")) {
        let debounceIndex = keyModifiers.indexOf("debounce");
        keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
      }
      if (keyModifiers.includes("throttle")) {
        let debounceIndex = keyModifiers.indexOf("throttle");
        keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
      }
      if (keyModifiers.length === 0)
        return false;
      if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
        return false;
      const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
      const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
      keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
      if (selectedSystemKeyModifiers.length > 0) {
        const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
          if (modifier === "cmd" || modifier === "super")
            modifier = "meta";
          return e[`${modifier}Key`];
        });
        if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
          if (isClickEvent(e.type))
            return false;
          if (keyToModifiers(e.key).includes(keyModifiers[0]))
            return false;
        }
      }
      return true;
    }
    function keyToModifiers(key) {
      if (!key)
        return [];
      key = kebabCase2(key);
      let modifierToKeyMap = {
        "ctrl": "control",
        "slash": "/",
        "space": " ",
        "spacebar": " ",
        "cmd": "meta",
        "esc": "escape",
        "up": "arrow-up",
        "down": "arrow-down",
        "left": "arrow-left",
        "right": "arrow-right",
        "period": ".",
        "comma": ",",
        "equal": "=",
        "minus": "-",
        "underscore": "_"
      };
      modifierToKeyMap[key] = key;
      return Object.keys(modifierToKeyMap).map((modifier) => {
        if (modifierToKeyMap[modifier] === key)
          return modifier;
      }).filter((modifier) => modifier);
    }

    // packages/alpinejs/src/directives/x-model.js
    directive("model", (el, { modifiers, expression }, { effect: effect3, cleanup: cleanup2 }) => {
      let scopeTarget = el;
      if (modifiers.includes("parent")) {
        scopeTarget = el.parentNode;
      }
      let evaluateGet = evaluateLater(scopeTarget, expression);
      let evaluateSet;
      if (typeof expression === "string") {
        evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
      } else if (typeof expression === "function" && typeof expression() === "string") {
        evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
      } else {
        evaluateSet = () => {
        };
      }
      let getValue = () => {
        let result;
        evaluateGet((value) => result = value);
        return isGetterSetter(result) ? result.get() : result;
      };
      let setValue = (value) => {
        let result;
        evaluateGet((value2) => result = value2);
        if (isGetterSetter(result)) {
          result.set(value);
        } else {
          evaluateSet(() => {
          }, {
            scope: { "__placeholder": value }
          });
        }
      };
      if (typeof expression === "string" && el.type === "radio") {
        mutateDom(() => {
          if (!el.hasAttribute("name"))
            el.setAttribute("name", expression);
        });
      }
      let event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
      let removeListener = isCloning ? () => {
      } : on(el, event, modifiers, (e) => {
        setValue(getInputValue(el, modifiers, e, getValue()));
      });
      if (modifiers.includes("fill")) {
        if ([void 0, null, ""].includes(getValue()) || isCheckbox(el) && Array.isArray(getValue()) || el.tagName.toLowerCase() === "select" && el.multiple) {
          setValue(
            getInputValue(el, modifiers, { target: el }, getValue())
          );
        }
      }
      if (!el._x_removeModelListeners)
        el._x_removeModelListeners = {};
      el._x_removeModelListeners["default"] = removeListener;
      cleanup2(() => el._x_removeModelListeners["default"]());
      if (el.form) {
        let removeResetListener = on(el.form, "reset", [], (e) => {
          nextTick(() => el._x_model && el._x_model.set(getInputValue(el, modifiers, { target: el }, getValue())));
        });
        cleanup2(() => removeResetListener());
      }
      el._x_model = {
        get() {
          return getValue();
        },
        set(value) {
          setValue(value);
        }
      };
      el._x_forceModelUpdate = (value) => {
        if (value === void 0 && typeof expression === "string" && expression.match(/\./))
          value = "";
        window.fromModel = true;
        mutateDom(() => bind(el, "value", value));
        delete window.fromModel;
      };
      effect3(() => {
        let value = getValue();
        if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
          return;
        el._x_forceModelUpdate(value);
      });
    });
    function getInputValue(el, modifiers, event, currentValue) {
      return mutateDom(() => {
        if (event instanceof CustomEvent && event.detail !== void 0)
          return event.detail !== null && event.detail !== void 0 ? event.detail : event.target.value;
        else if (isCheckbox(el)) {
          if (Array.isArray(currentValue)) {
            let newValue = null;
            if (modifiers.includes("number")) {
              newValue = safeParseNumber(event.target.value);
            } else if (modifiers.includes("boolean")) {
              newValue = safeParseBoolean(event.target.value);
            } else {
              newValue = event.target.value;
            }
            return event.target.checked ? currentValue.includes(newValue) ? currentValue : currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
          } else {
            return event.target.checked;
          }
        } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
          if (modifiers.includes("number")) {
            return Array.from(event.target.selectedOptions).map((option) => {
              let rawValue = option.value || option.text;
              return safeParseNumber(rawValue);
            });
          } else if (modifiers.includes("boolean")) {
            return Array.from(event.target.selectedOptions).map((option) => {
              let rawValue = option.value || option.text;
              return safeParseBoolean(rawValue);
            });
          }
          return Array.from(event.target.selectedOptions).map((option) => {
            return option.value || option.text;
          });
        } else {
          let newValue;
          if (isRadio(el)) {
            if (event.target.checked) {
              newValue = event.target.value;
            } else {
              newValue = currentValue;
            }
          } else {
            newValue = event.target.value;
          }
          if (modifiers.includes("number")) {
            return safeParseNumber(newValue);
          } else if (modifiers.includes("boolean")) {
            return safeParseBoolean(newValue);
          } else if (modifiers.includes("trim")) {
            return newValue.trim();
          } else {
            return newValue;
          }
        }
      });
    }
    function safeParseNumber(rawValue) {
      let number = rawValue ? parseFloat(rawValue) : null;
      return isNumeric2(number) ? number : rawValue;
    }
    function checkedAttrLooseCompare2(valueA, valueB) {
      return valueA == valueB;
    }
    function isNumeric2(subject) {
      return !Array.isArray(subject) && !isNaN(subject);
    }
    function isGetterSetter(value) {
      return value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
    }

    // packages/alpinejs/src/directives/x-cloak.js
    directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));

    // packages/alpinejs/src/directives/x-init.js
    addInitSelector(() => `[${prefix("init")}]`);
    directive("init", skipDuringClone((el, { expression }, { evaluate: evaluate2 }) => {
      if (typeof expression === "string") {
        return !!expression.trim() && evaluate2(expression, {}, false);
      }
      return evaluate2(expression, {}, false);
    }));

    // packages/alpinejs/src/directives/x-text.js
    directive("text", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
      let evaluate2 = evaluateLater2(expression);
      effect3(() => {
        evaluate2((value) => {
          mutateDom(() => {
            el.textContent = value;
          });
        });
      });
    });

    // packages/alpinejs/src/directives/x-html.js
    directive("html", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
      let evaluate2 = evaluateLater2(expression);
      effect3(() => {
        evaluate2((value) => {
          mutateDom(() => {
            el.innerHTML = value;
            el._x_ignoreSelf = true;
            initTree(el);
            delete el._x_ignoreSelf;
          });
        });
      });
    });

    // packages/alpinejs/src/directives/x-bind.js
    mapAttributes(startingWith(":", into(prefix("bind:"))));
    var handler2 = (el, { value, modifiers, expression, original }, { effect: effect3, cleanup: cleanup2 }) => {
      if (!value) {
        let bindingProviders = {};
        injectBindingProviders(bindingProviders);
        let getBindings = evaluateLater(el, expression);
        getBindings((bindings) => {
          applyBindingsObject(el, bindings, original);
        }, { scope: bindingProviders });
        return;
      }
      if (value === "key")
        return storeKeyForXFor(el, expression);
      if (el._x_inlineBindings && el._x_inlineBindings[value] && el._x_inlineBindings[value].extract) {
        return;
      }
      let evaluate2 = evaluateLater(el, expression);
      effect3(() => evaluate2((result) => {
        if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
          result = "";
        }
        mutateDom(() => bind(el, value, result, modifiers));
      }));
      cleanup2(() => {
        el._x_undoAddedClasses && el._x_undoAddedClasses();
        el._x_undoAddedStyles && el._x_undoAddedStyles();
      });
    };
    handler2.inline = (el, { value, modifiers, expression }) => {
      if (!value)
        return;
      if (!el._x_inlineBindings)
        el._x_inlineBindings = {};
      el._x_inlineBindings[value] = { expression, extract: false };
    };
    directive("bind", handler2);
    function storeKeyForXFor(el, expression) {
      el._x_keyExpression = expression;
    }

    // packages/alpinejs/src/directives/x-data.js
    addRootSelector(() => `[${prefix("data")}]`);
    directive("data", (el, { expression }, { cleanup: cleanup2 }) => {
      if (shouldSkipRegisteringDataDuringClone(el))
        return;
      expression = expression === "" ? "{}" : expression;
      let magicContext = {};
      injectMagics(magicContext, el);
      let dataProviderContext = {};
      injectDataProviders(dataProviderContext, magicContext);
      let data2 = evaluate(el, expression, { scope: dataProviderContext });
      if (data2 === void 0 || data2 === true)
        data2 = {};
      injectMagics(data2, el);
      let reactiveData = reactive(data2);
      initInterceptors(reactiveData);
      let undo = addScopeToNode(el, reactiveData);
      reactiveData["init"] && evaluate(el, reactiveData["init"]);
      cleanup2(() => {
        reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
        undo();
      });
    });
    interceptClone((from, to) => {
      if (from._x_dataStack) {
        to._x_dataStack = from._x_dataStack;
        to.setAttribute("data-has-alpine-state", true);
      }
    });
    function shouldSkipRegisteringDataDuringClone(el) {
      if (!isCloning)
        return false;
      if (isCloningLegacy)
        return true;
      return el.hasAttribute("data-has-alpine-state");
    }

    // packages/alpinejs/src/directives/x-show.js
    directive("show", (el, { modifiers, expression }, { effect: effect3 }) => {
      let evaluate2 = evaluateLater(el, expression);
      if (!el._x_doHide)
        el._x_doHide = () => {
          mutateDom(() => {
            el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
          });
        };
      if (!el._x_doShow)
        el._x_doShow = () => {
          mutateDom(() => {
            if (el.style.length === 1 && el.style.display === "none") {
              el.removeAttribute("style");
            } else {
              el.style.removeProperty("display");
            }
          });
        };
      let hide = () => {
        el._x_doHide();
        el._x_isShown = false;
      };
      let show = () => {
        el._x_doShow();
        el._x_isShown = true;
      };
      let clickAwayCompatibleShow = () => setTimeout(show);
      let toggle = once(
        (value) => value ? show() : hide(),
        (value) => {
          if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
            el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
          } else {
            value ? clickAwayCompatibleShow() : hide();
          }
        }
      );
      let oldValue;
      let firstTime = true;
      effect3(() => evaluate2((value) => {
        if (!firstTime && value === oldValue)
          return;
        if (modifiers.includes("immediate"))
          value ? clickAwayCompatibleShow() : hide();
        toggle(value);
        oldValue = value;
        firstTime = false;
      }));
    });

    // packages/alpinejs/src/directives/x-for.js
    directive("for", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
      let iteratorNames = parseForExpression(expression);
      let evaluateItems = evaluateLater(el, iteratorNames.items);
      let evaluateKey = evaluateLater(
        el,
        // the x-bind:key expression is stored for our use instead of evaluated.
        el._x_keyExpression || "index"
      );
      el._x_prevKeys = [];
      el._x_lookup = {};
      effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
      cleanup2(() => {
        Object.values(el._x_lookup).forEach((el2) => mutateDom(
          () => {
            destroyTree(el2);
            el2.remove();
          }
        ));
        delete el._x_prevKeys;
        delete el._x_lookup;
      });
    });
    function loop(el, iteratorNames, evaluateItems, evaluateKey) {
      let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
      let templateEl = el;
      evaluateItems((items) => {
        if (isNumeric3(items) && items >= 0) {
          items = Array.from(Array(items).keys(), (i) => i + 1);
        }
        if (items === void 0)
          items = [];
        let lookup = el._x_lookup;
        let prevKeys = el._x_prevKeys;
        let scopes = [];
        let keys = [];
        if (isObject2(items)) {
          items = Object.entries(items).map(([key, value]) => {
            let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
            evaluateKey((value2) => {
              if (keys.includes(value2))
                warn("Duplicate key on x-for", el);
              keys.push(value2);
            }, { scope: { index: key, ...scope2 } });
            scopes.push(scope2);
          });
        } else {
          for (let i = 0; i < items.length; i++) {
            let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
            evaluateKey((value) => {
              if (keys.includes(value))
                warn("Duplicate key on x-for", el);
              keys.push(value);
            }, { scope: { index: i, ...scope2 } });
            scopes.push(scope2);
          }
        }
        let adds = [];
        let moves = [];
        let removes = [];
        let sames = [];
        for (let i = 0; i < prevKeys.length; i++) {
          let key = prevKeys[i];
          if (keys.indexOf(key) === -1)
            removes.push(key);
        }
        prevKeys = prevKeys.filter((key) => !removes.includes(key));
        let lastKey = "template";
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          let prevIndex = prevKeys.indexOf(key);
          if (prevIndex === -1) {
            prevKeys.splice(i, 0, key);
            adds.push([lastKey, i]);
          } else if (prevIndex !== i) {
            let keyInSpot = prevKeys.splice(i, 1)[0];
            let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
            prevKeys.splice(i, 0, keyForSpot);
            prevKeys.splice(prevIndex, 0, keyInSpot);
            moves.push([keyInSpot, keyForSpot]);
          } else {
            sames.push(key);
          }
          lastKey = key;
        }
        for (let i = 0; i < removes.length; i++) {
          let key = removes[i];
          if (!(key in lookup))
            continue;
          mutateDom(() => {
            destroyTree(lookup[key]);
            lookup[key].remove();
          });
          delete lookup[key];
        }
        for (let i = 0; i < moves.length; i++) {
          let [keyInSpot, keyForSpot] = moves[i];
          let elInSpot = lookup[keyInSpot];
          let elForSpot = lookup[keyForSpot];
          let marker = document.createElement("div");
          mutateDom(() => {
            if (!elForSpot)
              warn(`x-for ":key" is undefined or invalid`, templateEl, keyForSpot, lookup);
            elForSpot.after(marker);
            elInSpot.after(elForSpot);
            elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
            marker.before(elInSpot);
            elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
            marker.remove();
          });
          elForSpot._x_refreshXForScope(scopes[keys.indexOf(keyForSpot)]);
        }
        for (let i = 0; i < adds.length; i++) {
          let [lastKey2, index] = adds[i];
          let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
          if (lastEl._x_currentIfEl)
            lastEl = lastEl._x_currentIfEl;
          let scope2 = scopes[index];
          let key = keys[index];
          let clone2 = document.importNode(templateEl.content, true).firstElementChild;
          let reactiveScope = reactive(scope2);
          addScopeToNode(clone2, reactiveScope, templateEl);
          clone2._x_refreshXForScope = (newScope) => {
            Object.entries(newScope).forEach(([key2, value]) => {
              reactiveScope[key2] = value;
            });
          };
          mutateDom(() => {
            lastEl.after(clone2);
            skipDuringClone(() => initTree(clone2))();
          });
          if (typeof key === "object") {
            warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
          }
          lookup[key] = clone2;
        }
        for (let i = 0; i < sames.length; i++) {
          lookup[sames[i]]._x_refreshXForScope(scopes[keys.indexOf(sames[i])]);
        }
        templateEl._x_prevKeys = keys;
      });
    }
    function parseForExpression(expression) {
      let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
      let stripParensRE = /^\s*\(|\)\s*$/g;
      let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
      let inMatch = expression.match(forAliasRE);
      if (!inMatch)
        return;
      let res = {};
      res.items = inMatch[2].trim();
      let item = inMatch[1].replace(stripParensRE, "").trim();
      let iteratorMatch = item.match(forIteratorRE);
      if (iteratorMatch) {
        res.item = item.replace(forIteratorRE, "").trim();
        res.index = iteratorMatch[1].trim();
        if (iteratorMatch[2]) {
          res.collection = iteratorMatch[2].trim();
        }
      } else {
        res.item = item;
      }
      return res;
    }
    function getIterationScopeVariables(iteratorNames, item, index, items) {
      let scopeVariables = {};
      if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
        let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
        names.forEach((name, i) => {
          scopeVariables[name] = item[i];
        });
      } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
        let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
        names.forEach((name) => {
          scopeVariables[name] = item[name];
        });
      } else {
        scopeVariables[iteratorNames.item] = item;
      }
      if (iteratorNames.index)
        scopeVariables[iteratorNames.index] = index;
      if (iteratorNames.collection)
        scopeVariables[iteratorNames.collection] = items;
      return scopeVariables;
    }
    function isNumeric3(subject) {
      return !Array.isArray(subject) && !isNaN(subject);
    }

    // packages/alpinejs/src/directives/x-ref.js
    function handler3() {
    }
    handler3.inline = (el, { expression }, { cleanup: cleanup2 }) => {
      let root = closestRoot(el);
      if (!root._x_refs)
        root._x_refs = {};
      root._x_refs[expression] = el;
      cleanup2(() => delete root._x_refs[expression]);
    };
    directive("ref", handler3);

    // packages/alpinejs/src/directives/x-if.js
    directive("if", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
      if (el.tagName.toLowerCase() !== "template")
        warn("x-if can only be used on a <template> tag", el);
      let evaluate2 = evaluateLater(el, expression);
      let show = () => {
        if (el._x_currentIfEl)
          return el._x_currentIfEl;
        let clone2 = el.content.cloneNode(true).firstElementChild;
        addScopeToNode(clone2, {}, el);
        mutateDom(() => {
          el.after(clone2);
          skipDuringClone(() => initTree(clone2))();
        });
        el._x_currentIfEl = clone2;
        el._x_undoIf = () => {
          mutateDom(() => {
            destroyTree(clone2);
            clone2.remove();
          });
          delete el._x_currentIfEl;
        };
        return clone2;
      };
      let hide = () => {
        if (!el._x_undoIf)
          return;
        el._x_undoIf();
        delete el._x_undoIf;
      };
      effect3(() => evaluate2((value) => {
        value ? show() : hide();
      }));
      cleanup2(() => el._x_undoIf && el._x_undoIf());
    });

    // packages/alpinejs/src/directives/x-id.js
    directive("id", (el, { expression }, { evaluate: evaluate2 }) => {
      let names = evaluate2(expression);
      names.forEach((name) => setIdRoot(el, name));
    });
    interceptClone((from, to) => {
      if (from._x_ids) {
        to._x_ids = from._x_ids;
      }
    });

    // packages/alpinejs/src/directives/x-on.js
    mapAttributes(startingWith("@", into(prefix("on:"))));
    directive("on", skipDuringClone((el, { value, modifiers, expression }, { cleanup: cleanup2 }) => {
      let evaluate2 = expression ? evaluateLater(el, expression) : () => {
      };
      if (el.tagName.toLowerCase() === "template") {
        if (!el._x_forwardEvents)
          el._x_forwardEvents = [];
        if (!el._x_forwardEvents.includes(value))
          el._x_forwardEvents.push(value);
      }
      let removeListener = on(el, value, modifiers, (e) => {
        evaluate2(() => {
        }, { scope: { "$event": e }, params: [e] });
      });
      cleanup2(() => removeListener());
    }));

    // packages/alpinejs/src/directives/index.js
    warnMissingPluginDirective("Collapse", "collapse", "collapse");
    warnMissingPluginDirective("Intersect", "intersect", "intersect");
    warnMissingPluginDirective("Focus", "trap", "focus");
    warnMissingPluginDirective("Mask", "mask", "mask");
    function warnMissingPluginDirective(name, directiveName, slug) {
      directive(directiveName, (el) => warn(`You can't use [x-${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
    }

    // packages/alpinejs/src/index.js
    alpine_default.setEvaluator(normalEvaluator);
    alpine_default.setReactivityEngine({ reactive: reactive2, effect: effect2, release: stop, raw: toRaw });
    var src_default = alpine_default;

    // packages/alpinejs/builds/module.js
    var module_default = src_default;

    function isFormDataSubmitterSupported() {
        try {
            new FormData(document.createElement('form'), 
            // @ts-expect-error if FormData supports the submitter parameter, this will throw
            0);
        }
        catch (e) {
            return false;
        }
    }
    // Inspired by https://github.com/remix-run/react-router/blob/9afac15d8cbe30b37d0f9e8b89c9f1e430dfe35a/packages/react-router-dom/dom.ts#L250
    function getFormSubmissionInfo(target, submitter) {
        let method;
        let action;
        let formData = undefined;
        let defaultMethod = 'GET';
        if (isFormElement(target)) {
            action = target.action;
            method = target.getAttribute('method') || defaultMethod;
            formData = new FormData(target, submitter || null);
        }
        else if (isButtonElement(target) ||
            (isInputElement(target) && (target.type === 'submit' || target.type === 'image'))) {
            let form = target.form;
            if (form == null) {
                throw new Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);
            }
            let attr = target.formAction || form.action;
            action = attr;
            method = target.getAttribute('formmethod') || form.getAttribute('method') || defaultMethod;
            // Build a FormData object populated from a form and submitter
            formData = new FormData(form, target);
            // If this browser doesn't support the `FormData(el, submitter)` format,
            // then tack on the submitter value at the end.  This is a lightweight
            // solution that is not 100% spec compliant.  For complete support in older
            // browsers, consider using the `formdata-submitter-polyfill` package
            if (!isFormDataSubmitterSupported()) {
                let { name, type, value } = target;
                if (type === 'image') {
                    let prefix = name ? `${name}.` : '';
                    formData.append(`${prefix}x`, '0');
                    formData.append(`${prefix}y`, '0');
                }
                else if (name) {
                    formData.append(name, value);
                }
            }
        }
        else if (isHtmlElement(target)) {
            throw new Error(`Cannot submit element that is not <form>, <button>, or ` + `<input type="submit|image">`);
        }
        else {
            method = defaultMethod;
            action = null;
        }
        return {
            action,
            method: method.toUpperCase(),
            formData,
        };
    }
    function isModifiedEvent(event) {
        return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
    }
    // Inspired by https://github.com/remix-run/react-router/blob/9afac15d8cbe30b37d0f9e8b89c9f1e430dfe35a/packages/react-router-dom/dom.ts#L36
    function shouldProcessLinkClick(event, target) {
        return (event.button === 0 && // Ignore everything but left clicks
            (!target || target === '_self') && // Let browser handle "target=_blank" etc.
            !isModifiedEvent(event) // Ignore clicks with modifier keys
        );
    }
    function isHtmlElement(node) {
        return node != undefined && node != null && typeof node.tagName === 'string' && node.nodeType === Node.ELEMENT_NODE;
    }
    function isAnchorElement(node) {
        return isHtmlElement(node) && node.nodeName === 'A';
    }
    function isFormElement(node) {
        return isHtmlElement(node) && node.nodeName === 'FORM';
    }
    function isInputElement(node) {
        return isHtmlElement(node) && node.nodeName === 'INPUT';
    }
    function isInputNumberElement(node) {
        return isHtmlElement(node) && node.nodeName === 'INPUT' && node.getAttribute('type') == 'number';
    }
    function isButtonElement(node) {
        return isHtmlElement(node) && node.nodeName === 'BUTTON';
    }
    function isTemplateElement(node) {
        return isHtmlElement(node) && node.nodeName === 'TEMPLATE';
    }

    function cache (Alpine) {
        Alpine.store('cache', cacheStore());
        Alpine.directive('cache', ($el, { modifiers, expression }, { Alpine, evaluate }) => {
            var _a;
            if (!isHtmlElement($el)) {
                throw new Error(`Expected HTMLElement but got ${$el}`);
            }
            if ($el.nodeName !== 'SCRIPT') {
                throw new Error('Can only be used on script tags');
            }
            // Do nothing if the script tag is empty
            if (((_a = $el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) == '') {
                return;
            }
            let json;
            try {
                json = JSON.parse($el.textContent || '{}');
            }
            catch (e) {
                throw new Error(`Could not parse ${$el.textContent} as JSON: ${e}`);
            }
            const resourceName = modifiers[0];
            if (!resourceName) {
                throw new Error('Must specify a store to cache to e.g. x-cache.products');
            }
            const cache = Alpine.store('cache').resources;
            const cacheResource = cache[resourceName];
            if (!cacheResource) {
                throw new Error(`Could not find resource named ${resourceName}. Did you define it in the cache store?`);
            }
            if (expression) {
                const cacheKey = evaluate(expression);
                cacheResource.set(cacheKey, json);
            }
            else {
                if (isSingletonResource(cacheResource)) {
                    cacheResource.set(json);
                }
                else {
                    cacheResource.upsert(json);
                }
            }
        }).before('bind');
        Alpine.magic('cache', () => {
            return Alpine.store('cache').resources;
        });
    }
    function isSingletonResource(x) {
        if ('isSingleton' in x && x.isSingleton) {
            return true;
        }
        return false;
    }
    // TODO test me and document me
    function buildResource(builder) {
        return {
            records: {},
            set(key, value) {
                this.records[key] = value;
            },
            populate(records) {
                this.records = records;
            },
            upsert(records) {
                this.records = Object.assign(Object.assign({}, this.records), records);
            },
            evict(key) {
                delete this.records[key];
            },
            reset() {
                this.records = {};
            },
            get(key) {
                const result = this.records[key];
                if (!result) {
                    return null;
                }
                if (builder) {
                    return builder(result);
                }
                return result;
            },
            get isSingleton() {
                return false;
            },
        };
    }
    // TODO test me and document me
    function buildSingletonResource(builder) {
        return {
            record: null,
            set(value) {
                this.record = value;
            },
            evict() {
                this.record = null;
            },
            reset() {
                this.record = null;
            },
            get() {
                const result = this.record;
                if (!result) {
                    return null;
                }
                if (builder) {
                    return builder(result);
                }
                return result;
            },
            get isSingleton() {
                return true;
            },
        };
    }
    function cacheStore() {
        return {
            resources: {},
            reset() {
                Object.keys(this.resources).forEach((key) => {
                    this.resources[key].reset();
                });
            },
            addResource(key, options) {
                if (options === null || options === void 0 ? void 0 : options.singleton) {
                    this.resources[key] = buildSingletonResource(options === null || options === void 0 ? void 0 : options.builder);
                }
                else {
                    this.resources[key] = buildResource(options === null || options === void 0 ? void 0 : options.builder);
                }
            },
        };
    }

    function isPlainObject(x) {
        return typeof x === 'object' && x !== null && !Array.isArray(x) && !(x instanceof Date);
    }

    var ThemeEditorEvent;
    (function (ThemeEditorEvent) {
        ThemeEditorEvent["INSPECTOR_ACTIVATED"] = "shopify:inspector:activate";
        ThemeEditorEvent["INSPECTOR_DEACTIVATED"] = "shopify:inspector:deactivate";
        ThemeEditorEvent["SECTION_LOAD"] = "shopify:section:load";
        ThemeEditorEvent["SECTION_UNLOAD"] = "shopify:section:unload";
        ThemeEditorEvent["SECTION_SELECT"] = "shopify:section:select";
        ThemeEditorEvent["SECTION_DESELECT"] = "shopify:section:deselect";
        ThemeEditorEvent["SECTION_REORDER"] = "shopify:section:reorder";
        ThemeEditorEvent["BLOCK_SELECT"] = "shopify:block:select";
        ThemeEditorEvent["BLOCK_DESELECT"] = "shopify:block:deselect";
    })(ThemeEditorEvent || (ThemeEditorEvent = {}));

    var ThemeEvent;
    (function (ThemeEvent) {
        ThemeEvent[ThemeEvent["theme:cart:add"] = 0] = "theme:cart:add";
        ThemeEvent[ThemeEvent["theme:cart:update"] = 1] = "theme:cart:update";
        ThemeEvent[ThemeEvent["theme:section:navigate"] = 2] = "theme:section:navigate";
        ThemeEvent[ThemeEvent["theme:section:load"] = 3] = "theme:section:load";
        ThemeEvent[ThemeEvent["theme:section:update"] = 4] = "theme:section:update";
    })(ThemeEvent || (ThemeEvent = {}));

    function bindAllThemeSections(Alpine, cb) {
        document.addEventListener('alpine:init', () => {
            const sections = document.getElementsByClassName('shopify-section');
            for (const el of sections) {
                if (isHtmlElement(el)) {
                    cb(el);
                }
            }
            // Re-bind sections when they are re-loaded by the theme editor
            window.addEventListener(ThemeEditorEvent.SECTION_LOAD, (e) => {
                var _a;
                if ((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode) {
                    const loadedEvent = e;
                    const section = document.getElementById(`shopify-section-${loadedEvent.detail.sectionId}`);
                    if (section) {
                        Alpine.deferMutations();
                        cb(section);
                        Alpine.flushAndStopDeferringMutations();
                    }
                }
            });
        });
    }

    /**
     * StateMachine: A generic finite state machine implementation.
     *
     * A state machine is a conceptual model used to design systems and applications. It consists of a finite set of states and
     * transitions between those states, often driven by events. State machines are ideal for situations where an application or system
     * can be thought of as having distinct states with well-defined transitions, such as user interfaces, protocols, and life cycles.
     *
     * @template TStates A tuple of string literals representing the possible states.
     * @template TTransitions A mapping of each state to an array of states to which it can transition.
     * @template TState The current state of the machine, must be one of TStates.
     *
     * The `StateMachine` class provides mechanisms to manage states, transitions, and listeners that react to state changes.
     *
     * Usage example:
     *
     * // Define states and transitions
     * const states = ['idle', 'loading', 'success', 'error'] as const;
     * const transitions = {
     *   idle: ['loading'],
     *   loading: ['success', 'error'],
     *   success: ['idle'],
     *   error: ['idle'],
     * };
     *
     * // Create a state machine
     * const machine = new StateMachine('idle', states, transitions);
     *
     * // Listen for state changes
     * machine.on((newState, prevState) => {
     *   console.log(`Transitioned from ${prevState} to ${newState}`);
     * });
     *
     * // Change state
     * machine.state = 'loading';
     *
     * Features:
     * - Strongly typed states and transitions ensure only valid state changes are possible.
     * - Event listeners for state changes, to react to or log transitions.
     * - Custom error handling for invalid transitions.
     *
     * The class manages the current state privately and allows state changes only through the state setter,
     * which checks for valid transitions and notifies listeners.
     */
    class StateMachine {
        /**
         * Initializes the state machine with the specified initial state, possible states, and valid transitions.
         *
         * @param initialState The starting state of the state machine.
         * @param states An array of possible states the state machine can be in.
         * @param transitions A record mapping each state to an array of states to which it can transition.
         *
         */
        constructor(initialState, states, transitions) {
            this._prevState = null;
            this.listeners = [];
            this._state = initialState;
            this.states = states;
            this.transitions = transitions;
        }
        /**
         *  Attempts to transition the state machine to a new state. Validates the transition against the defined rules
         *  and, if valid, updates the state and triggers the listeners. Throws an error if the transition is invalid.
         */
        set state(newState) {
            const validTransitions = intersectArrays(this.states, this.transitions[this._state] || []);
            if (validTransitions.includes(newState)) {
                let prevState = this._state;
                this._prevState = prevState;
                this._state = newState;
                this.listeners.forEach((listener) => listener(newState, prevState));
            }
            else {
                throw new Error(`Invalid transition from ${this._state} to ${newState}`);
            }
        }
        /**
         * Transitions the state machine to a new state, but only temporarily. After the specified timeout, the state will transition to the next state
         * This method is useful for UI interactions that should only be visible for a short period of time, such as a success message after a form submission.
         */
        setTransientState(transientState, nextState, timeout) {
            return new Promise((resolve) => {
                // Transition to the transient state immediately
                this._state = transientState;
                // Then, after a timeout, transition to the next state
                setTimeout(() => {
                    this._state = nextState;
                    resolve();
                }, timeout);
            });
        }
        /**
         * Returns the current state of the state machine.
         */
        get state() {
            return this._state;
        }
        /**
         * Returns the previous state of the state machine (if this is the initial state it will return null)
         */
        get prevState() {
            return this._prevState;
        }
        /**
         * Registers a new listener function to be called when the state changes.
         * @param listener
         */
        on(listener) {
            this.listeners.push(listener);
        }
        /**
         * Removes a previously registered listener function so that it will no longer be called on state changes.
         * @param listener
         */
        off(listener) {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        }
    }
    function intersectArrays(arr1, arr2) {
        const set2 = new Set(arr2);
        return arr1.filter((x) => set2.has(x));
    }

    (undefined && undefined.__rest) || function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    /**
     * Enable the creation and management of asynchronous forms which provide an interface for handling form submissions
     * with various states such as idle, pending, success, and error as well as serializing form data
     *
     * Notes:
     * - Requires method-ui 'fetch' plugin
     *
     * Usage:
     * - x-async-form - Applied to the form element, initializing the async form functionality and adding a data context for child directives
     * - x-async-form:context - Defines the context for the async form, allowing sharing of form state with other elements.
     * - x-async-form:form - Binds to the form element to handle form submissions.
     *
     * The '$asyncForm' magic property provides a comprehensive API for managing the form state, including form data, response, parsed body, and error messages.
     *
     * Usage with form elements:
     * x-async-form may be used in conjunction with HTML form elements to handle asynchronous form submissions.
     *
     * e.g.
     *
     * <form x-async-form='({ action, method, formData  }) => yourFunction(action)' action="/some/url">
     *   <div x-text="`state: ${$asyncForm.state}`"></div>
     *   <div x-text="`error: ${$asyncForm.errorMessage}`"></div>
     *   <input type="text" name="testField1" value="">
     *   <input type="checkbox" name="testField2" value="true">
     *   <button type="submit">Submit</button>
     * </form>
     *
     * This will initialize the async form functionality, handle form submissions, and update the form state accordingly.
     *
     * Note: Consider using 'x-fetch-form' for a more streamlined experience. It wraps this plugin and automatically calls fetch, saving you a step.
     *
     */
    function asyncForm (Alpine) {
        Alpine.directive('async-form', ($el, data, utilities) => {
            if (data.value == 'form') {
                handleForm$1($el, Alpine, data, utilities);
            }
            else if (data.value == 'context') {
                handleContext($el, Alpine, data, utilities);
            }
            else {
                if (!data.expression) {
                    throw new Error('x-async-form directive requires a an async callback function');
                }
                if (!isFormElement($el)) {
                    throw new Error('x-async-form directive can only be used on form elements');
                }
                Alpine.bind($el, {
                    [`x-async-form:context.${data.modifiers.join('.')}`]: data.expression,
                    [`x-async-form:form.${data.modifiers.join('.')}`]: '',
                });
            }
        }).before('bind');
        Alpine.magic('asyncForm', handleAsyncFormMagic(Alpine));
    }
    function handleAsyncFormMagic(Alpine) {
        return function ($el) {
            const $data = Alpine.$data($el);
            return {
                get formData() {
                    return $data.__asyncForm_formData;
                },
                get state() {
                    return $data.__asyncForm_state;
                },
                get response() {
                    return $data.__asyncForm_response;
                },
                get parsedBody() {
                    return $data.__asyncForm_parsedBody;
                },
                get reset() {
                    return $data.__asyncForm_reset();
                },
                get errorMessage() {
                    return $data.__asyncForm_errorMessage;
                },
                get errorDescription() {
                    return $data.__asyncForm_errorDescription;
                },
            };
        };
    }
    function handleContext($el, Alpine, { expression, modifiers }, { evaluateLater }) {
        if (!expression) {
            throw new Error('x-async-form:context directive requires a fetch promise or callback function that returns a fetch promise');
        }
        let getCallbackFn = evaluateLater(expression);
        const errorTimeout = getErrorTimeoutModifier(modifiers) || false;
        const successTimeout = getSuccessTimeoutModifier(modifiers) || 1000;
        Alpine.bind($el, {
            'x-data'() {
                return {
                    __asyncForm_formEl: null,
                    __asyncForm_stateMachine: new StateMachine('idle', ['idle', 'pending', 'success', 'error'], {
                        idle: ['pending'],
                        pending: ['success', 'error', 'pending'],
                        success: ['idle', 'pending'],
                        error: ['idle', 'pending'],
                    }),
                    __asyncForm_callback: null,
                    __asyncForm_formData: null,
                    __asyncForm_response: null,
                    __asyncForm_parsedBody: null,
                    __asyncForm_errorMessage: null,
                    __asyncForm_errorDescription: null,
                    __asyncForm_successTimeout: successTimeout || false,
                    __asyncForm_errorTimeout: errorTimeout || false,
                    init() {
                        this.$watch('__asyncForm_state', (state, prevState) => {
                            if ((prevState == 'success' || prevState == 'error') && state == 'idle') {
                                // Wipe form data after a successful or failed submission
                                this.__asyncForm_formData = null;
                            }
                            if (prevState == 'success' && state == 'idle') {
                                // Clear error message after a successful submission
                                this.__asyncForm_errorMessage = null;
                                this.__asyncForm_errorDescription = null;
                            }
                        });
                        Alpine.effect(() => {
                            // Create a function which wraps the passed in callback function / expression and allows us to call it when the user clicks the link
                            this.__asyncForm_callback = async (info) => {
                                let resultPromise;
                                Alpine.dontAutoEvaluateFunctions(() => {
                                    getCallbackFn(async (result) => {
                                        if (typeof result === 'function') {
                                            resultPromise = result.bind(this)(info);
                                        }
                                        else {
                                            throw new Error(`x-async-link expects an async function as its expression`);
                                        }
                                    });
                                });
                                return resultPromise;
                            };
                        });
                    },
                    get __asyncForm_state() {
                        return this.__asyncForm_stateMachine.state;
                    },
                    set __asyncForm_state(state) {
                        this.__asyncForm_stateMachine.state = state;
                    },
                    get __asyncForm_form() {
                        var _a;
                        let form = null;
                        if (this.$el.tagName === 'FORM') {
                            form = this.$el;
                        }
                        if (this.__asyncForm_formEl && ((_a = this.__asyncForm_formEl) === null || _a === void 0 ? void 0 : _a.tagName) === 'FORM') {
                            form = this.__asyncForm_formEl;
                        }
                        return form;
                    },
                    async __asyncForm_submit(info) {
                        this.__asyncForm_state = 'pending';
                        this.$dispatch('async-form:pending');
                        try {
                            // Run provided callback function
                            const response = await this.__asyncForm_callback.bind(this)(info);
                            return await this.__asyncForm_handleResponse(response);
                        }
                        catch (e) {
                            if (e.name == 'AbortError') {
                                this.__asyncForm_reset();
                                return false;
                            }
                            else {
                                this.__asyncForm_handleError(String((e === null || e === void 0 ? void 0 : e.message) || e));
                                throw e;
                            }
                        }
                    },
                    async __asyncForm_handleResponse(response) {
                        this.__asyncForm_response = response;
                        this.__asyncForm_parsedBody = await parseResponseBody(response);
                        if (!response || (response === null || response === void 0 ? void 0 : response.status) == undefined) {
                            // Handle the response object not being a fetch request
                            this.__asyncForm_handleSuccess();
                            return response;
                        }
                        else if (response.status === 200) {
                            this.__asyncForm_handleSuccess();
                            return response;
                        }
                        else {
                            let message = getErrorMessage(response, this.__asyncForm_parsedBody);
                            let description = getErrorDescription(response, this.__asyncForm_parsedBody);
                            this.__asyncForm_handleError(message, description);
                            return response;
                        }
                    },
                    async __asyncForm_handleSuccess() {
                        this.$dispatch('async-form:success', this.__asyncForm_formData);
                        if (successTimeout) {
                            // Transition to success state then back to initial state after a timeout
                            this.__asyncForm_stateMachine.setTransientState('success', 'idle', successTimeout);
                        }
                        else {
                            this.__asyncForm_state = 'success';
                        }
                    },
                    async __asyncForm_handleError(message, description) {
                        this.$dispatch(`async-form:error`, {
                            message: this.__asyncForm_errorMessage,
                            description: this.__asyncForm_errorDescription,
                        });
                        if (errorTimeout) {
                            // Transition to error state then back to initial state after a timeout
                            this.__asyncForm_stateMachine.setTransientState('error', 'idle', errorTimeout);
                        }
                        else {
                            this.__asyncForm_state = 'error';
                        }
                        this.__asyncForm_errorMessage = message;
                        this.__asyncForm_errorDescription = description;
                    },
                    __asyncForm_reset() {
                        this.__asyncForm_state == 'idle';
                        this.__asyncForm_response == null;
                        this.__asyncForm_parsedBody == null;
                        this.__asyncForm_errorMessage == null;
                        this.__asyncForm_errorDescription == null;
                        this.__asyncForm_formData == null;
                    },
                };
            },
        });
    }
    function handleForm$1($el, Alpine, { expression }, {}) {
        if (!isFormElement($el)) {
            throw new Error('x-async-form:form directive can only be used on form elements');
        }
        Alpine.bind($el, {
            'x-data'() {
                return {
                    __asyncForm_form_onSubmit(e) {
                        var _a;
                        // Prevent default form submission behaviour so we dont get a full page reload
                        e.preventDefault();
                        let { action: formAction, method, formData } = getFormSubmissionInfo($el, e.submitter);
                        let action = ((_a = this.__asyncForm_formEl) === null || _a === void 0 ? void 0 : _a.dataset.asyncAction) || formAction;
                        this.__asyncForm_formData = formData || null;
                        this.__asyncForm_submit({ action, method, formData });
                    },
                    init() {
                        if (this.__asyncForm_submit == undefined) {
                            throw new Error('x-async-form:form directive must be used within an x-async-form:context directive');
                        }
                    },
                };
            },
            'x-init': '__asyncForm_formEl = $el',
            '@submit': '__asyncForm_form_onSubmit',
        });
    }
    function getErrorTimeoutModifier(modifiers) {
        let errorTimeout = false;
        if (modifiers.includes('wait-error')) {
            const rawValue = modifiers[modifiers.indexOf('wait-error') + 1];
            let match = rawValue.match(/([0-9]+)ms/);
            if (match)
                errorTimeout = Number(match[1]);
        }
        return errorTimeout;
    }
    function getSuccessTimeoutModifier(modifiers) {
        let successTimeout = false;
        if (modifiers.includes('wait-success')) {
            const rawValue = modifiers[modifiers.indexOf('wait-success') + 1];
            let match = rawValue.match(/([0-9]+)ms/);
            if (match)
                successTimeout = Number(match[1]);
        }
        return successTimeout;
    }
    async function parseResponseBody(response) {
        var _a;
        if (!response)
            return null;
        // Bail out if the response is not similar to a standard fetch Response object
        if (!isPlainObject(response) || !('json' in response)) {
            return null;
        }
        // Note: we clone the response here in case the body has already been read
        if ((_a = response.headers.get('Content-Type')) === null || _a === void 0 ? void 0 : _a.includes('text/html')) {
            return await response.clone().text();
        }
        else {
            // Try to parse the body as json, if it fails, return the original response
            try {
                return await response.clone().json();
            }
            catch (e) {
                return await response.clone().text();
            }
        }
    }
    function getErrorMessage(response, parsedBody) {
        if (isPlainObject(parsedBody) && parsedBody.message) {
            return parsedBody.message;
        }
        return response.statusText;
    }
    function getErrorDescription(response, parsedBody) {
        if (isPlainObject(parsedBody)) {
            if (parsedBody.description) {
                return parsedBody.description;
            }
            if (parsedBody.error) {
                return parsedBody.error;
            }
        }
        return null;
    }

    /**
     * A plugin that makes it easy to progressively enhance links so that they can be
     * call endpoints via the fetch API and display pending states
     * while the request is in progress
     *
     * The x-async-link expects a either a promise or a function that returns a promise.
     *
     * @example
     *
     * <a
     *   href="/some-page"
     *   x-async-link="fetchSomeData"
     *   :class="{ 'opacity-50': $asyncLink.state == 'pending' }"
     * >Click Me</a>
     *
     * @example
     *
     * <div x-async-link:context="fetch(`${$url}.js`)">
     *   <div x-show="$asyncLink.state == 'pending'">Loading!</div>
     *   <a href="/some-page" x-async-link:link >Click Me</a>
     * </div>
     *
     * TODO:
     * - Document events
     */
    function asyncLink (Alpine) {
        Alpine.directive('async-link', ($el, data, { evaluateLater }) => {
            if (data.value == 'link') {
                if (!isAnchorElement($el)) {
                    throw new Error('x-async-link:link directive can only be used on anchor elements');
                }
                Alpine.bind($el, {
                    'x-data'() {
                        return {
                            __asyncLink_onClick(e) {
                                if (!shouldProcessLinkClick(e, $el.target))
                                    return;
                                // If some other function has already prevented the default action, do nothing
                                if (e.defaultPrevented)
                                    return;
                                // If the link is not an anchor tag, do nothing
                                if (!this.$el.href)
                                    return;
                                e.preventDefault();
                                this.__asyncLink_load(this.$el.href);
                            },
                            init() {
                                if (this.__asyncLink_state == undefined) {
                                    throw new Error('x-async-link:link directive must be used within an x-async-link:context directive');
                                }
                            },
                        };
                    },
                    '@click': '__asyncLink_onClick',
                });
            }
            else if (data.value == 'context') {
                if (!data.expression) {
                    throw new Error('x-async-link:context directive requires a an async callback function');
                }
                let getCallbackFn = evaluateLater(data.expression);
                Alpine.bind($el, {
                    'x-data'() {
                        return {
                            __asyncLink_pendingHref: null,
                            __asyncLink_stateMachine: new StateMachine('idle', ['idle', 'pending'], {
                                idle: ['pending'],
                                pending: ['pending', 'idle'],
                            }),
                            __asyncLink_callback: null,
                            __asyncLink_errorMessage: null,
                            __asyncLink_errorDescription: null,
                            init() {
                                this.$watch('__asyncLink_state', (state) => {
                                    this.$dispatch(`async-link:${state}`);
                                });
                                Alpine.effect(() => {
                                    // Create a function which wraps the passed in callback function / expression and allows us to call it when the user clicks the link
                                    this.__asyncLink_callback = async (href) => {
                                        let resultPromise;
                                        Alpine.dontAutoEvaluateFunctions(() => {
                                            getCallbackFn(async (result) => {
                                                if (typeof result === 'function') {
                                                    resultPromise = result.bind(this)(href);
                                                }
                                                else {
                                                    throw new Error(`x-async-link expects an async function as its expression`);
                                                }
                                            }, {
                                                params: [href],
                                                scope: { $href: href },
                                            });
                                        });
                                        return resultPromise;
                                    };
                                });
                            },
                            get __asyncLink_state() {
                                return this.__asyncLink_stateMachine.state;
                            },
                            get __asyncLink_prevState() {
                                return this.__asyncLink_stateMachine.prevState;
                            },
                            set __asyncLink_state(state) {
                                this.__asyncLink_stateMachine.state = state;
                            },
                            async __asyncLink_load(href) {
                                this.__asyncLink_state = 'pending';
                                this.__asyncLink_pendingHref = href;
                                try {
                                    // Run provided callback function
                                    const response = await this.__asyncLink_callback.bind(this)(href);
                                    if (!response || (response === null || response === void 0 ? void 0 : response.status) == undefined) {
                                        // Handle the response object not being a fetch request
                                        this.__asyncLink_handleSuccess();
                                        return response;
                                    }
                                    else if (response.status === 200) {
                                        this.__asyncLink_handleSuccess();
                                        return response;
                                    }
                                    else if (response.status === 422) {
                                        const body = await response.json();
                                        this.__asyncLink_handleError(body.message, body.description);
                                        return response;
                                    }
                                    else {
                                        this.__asyncLink_handleError(response.statusText);
                                        return response;
                                    }
                                }
                                catch (e) {
                                    if (e.name == 'AbortError') {
                                        this.__asyncLink_pendingHref = null;
                                        this.__asyncLink_state = 'idle';
                                        return false;
                                    }
                                    else {
                                        this.__asyncLink_handleError(String((e === null || e === void 0 ? void 0 : e.message) || e));
                                        throw e;
                                    }
                                }
                            },
                            async __asyncLink_handleSuccess() {
                                this.$dispatch('async-link:loaded', this.__asyncLink_pendingHref);
                                this.__asyncLink_state = 'idle';
                                this.__asyncLink_pendingHref = null;
                            },
                            async __asyncLink_handleError(message, description) {
                                this.__asyncLink_state = 'idle';
                                this.__asyncLink_errorMessage = message;
                                this.__asyncLink_errorDescription = description;
                                this.__asyncLink_pendingHref = null;
                            },
                            __asyncLink_reset() {
                                this.__asyncLink_state = 'idle';
                                this.__asyncLink_errorMessage = null;
                                this.__asyncLink_errorDescription = null;
                                this.__asyncLink_pendingHref = null;
                            },
                        };
                    },
                });
            }
            else {
                if (!data.expression) {
                    throw new Error('x-async-link directive requires a an async callback function');
                }
                if (!isAnchorElement($el)) {
                    throw new Error('x-async-link directive can only be used on anchor elements');
                }
                Alpine.bind($el, {
                    'x-async-link:context': data.expression,
                    [`x-async-link:link.${data.modifiers.join('.')}`]: '',
                });
            }
        }).before('bind');
        Alpine.magic('asyncLink', ($el) => {
            const $data = Alpine.$data($el);
            return {
                get pendingHref() {
                    return $data.__asyncLink_pendingHref;
                },
                get state() {
                    return $data.__asyncLink_state;
                },
                get reset() {
                    return $data.__asyncLink_reset();
                },
                get errorMessage() {
                    return $data.__asyncLink_errorMessage;
                },
                get errorDescription() {
                    return $data.__asyncLink_errorDescription;
                },
            };
        });
    }

    /**
     * This Alpine.js plugin provides a directive for handling navigation via links and forms,
     * allowing for asynchronous navigation without a full page reload. This is particularly useful
     * for creating single-page applications or enhancing user experience with faster navigation.
     *
     * The core functionality of this plugin is to interrupt the default page reloading behavior
     * of links and forms, and instead call a custom navigation callback function. This function
     * is responsible for re-rendering the page content dynamically.
     *
     * ## Custom Navigation Callback
     *
     * The `x-router` directive requires an async callback function that returns a fetch promise.
     * This function is crucial as it defines how the page content should be re-rendered when
     * navigation occurs. You can specify this callback using the `x-router` directive with an expression:
     *
     * ```html
     * <div x-router="customNavigate">
     *   <!-- Custom navigation logic here -->
     * </div>
     * ```
     *
     * The expression should be an async function that handles the fetch request and updates the view accordingly.
     *
     * ## Usage
     *
     * ### Link Navigation
     *
     * To use the `x-router` directive for link navigation, add the `x-router:link` directive to an anchor element:
     *
     * ```html
     * <a x-router:link href="/new-page">Go to New Page</a>
     * ```
     *
     * When the link is clicked, the plugin will handle the navigation asynchronously using the custom callback.
     *
     * ### Form Navigation
     *
     * To use the `x-router` directive for form navigation, add the `x-router:form` directive to a form element:
     *
     * ```html
     * <form x-router:form action="/submit-form" method="POST">
     *   <input type="text" name="example" />
     *   <button type="submit">Submit</button>
     * </form>
     * ```
     *
     * When the form is submitted, the plugin will handle the navigation asynchronously using the custom callback.
     *
     * ## History Management
     *
     * The plugin also manages browser history to ensure that back/forward navigation works as expected.
     *
     * When the user navigates back or forward, the plugin will reload the page to reflect the correct state.
     *
     * ## Example
     *
     * ```html
     * <a x-router:link href="/new-page">Go to New Page</a>
     *
     * <form x-router:form action="/submit-form" method="POST">
     *   <input type="text" name="example" />
     *   <button type="submit">Submit</button>
     * </form>
     *
     * <div x-router="customNavigate">
     *   <!-- Custom navigation logic here -->
     * </div>
     * ```
     */
    function router (Alpine) {
        Alpine.directive('router', ($el, data, { evaluateLater }) => {
            const historyMode = getHistoryModeModifier(data.modifiers);
            if (data.value == 'link') {
                Alpine.bind($el, {
                    [`x-async-link`]() {
                        return async (href) => {
                            const url = getNavigationUrl({ action: href }).toString();
                            return this.__router_navigate(url, historyMode);
                        };
                    },
                });
            }
            else if (data.value == 'form') {
                Alpine.bind($el, {
                    [`x-async-form`]() {
                        return async (info) => {
                            const url = getNavigationUrl(info).toString();
                            return this.__router_navigate(url, historyMode);
                        };
                    },
                });
            }
            else {
                if (!data.expression) {
                    throw new Error('x-router directive requires an async callback function that returns a fetch promise');
                }
                let getCallbackFn = evaluateLater(data.expression);
                if (!window._x_router_initialized) {
                    // Add initial state to the history object so that popstate event is fired when the user navigates back/forward
                    window.history.replaceState({
                        fromRouter: true,
                        url: document.location.href,
                    }, '', document.location.href);
                    // Reload the page when the user navigates back/forward since our usage of pushState/replaceState would cause the browser not to trigger a page reload
                    window.addEventListener('popstate', (event) => {
                        var _a;
                        if ((_a = event.state) === null || _a === void 0 ? void 0 : _a.fromRouter) {
                            // NOTE this is a quick fix in order to get back/forward buttons working as expected with the router,
                            // however a better solution for things like the collection view would probably be to call the callback function
                            // with the correct href and then update the view accordingly without a page reload i.e. when using $sectionApi.
                            // We'll revisit that when we have time
                            window.location.reload();
                        }
                    });
                    window._x_router_initialized = true;
                }
                Alpine.bind($el, {
                    'x-data'() {
                        return {
                            __router_callback: null,
                            init() {
                                Alpine.effect(() => {
                                    // Create a function which wraps the passed in callback function / expression and allows us to call it when the user clicks the link
                                    this.__router_callback = async (href) => {
                                        let resultPromise;
                                        Alpine.dontAutoEvaluateFunctions(() => {
                                            getCallbackFn(async (result) => {
                                                if (typeof result === 'function') {
                                                    resultPromise = result.bind(this)(href);
                                                }
                                                else {
                                                    throw new Error(`x-async-link expects an async function as its expression`);
                                                }
                                            });
                                        });
                                        return resultPromise;
                                    };
                                });
                            },
                            async __router_navigate(urlOrHref, historyMode) {
                                const url = new URL(urlOrHref);
                                if (historyMode == 'replace') {
                                    window.history.replaceState({ fromRouter: true, url: url.toString() }, '', url.toString());
                                }
                                else if (historyMode == 'push') {
                                    window.history.pushState({ fromRouter: true, url: url.toString() }, '', url.toString());
                                }
                                const promise = this.__router_callback(url);
                                return promise;
                            },
                        };
                    },
                });
            }
        }).before('bind');
        Alpine.magic('router', ($el) => {
            const $data = Alpine.$data($el);
            return {
                navigate(url, historyMode) {
                    return $data.__router_navigate(url, historyMode);
                },
            };
        });
    }
    function getHistoryModeModifier(modifiers, defaultMode = 'push') {
        if (modifiers.includes('replace')) {
            return 'replace';
        }
        else if (modifiers.includes('push')) {
            return 'push';
        }
        else if (modifiers.includes('nopush')) {
            return 'none';
        }
        else {
            return defaultMode;
        }
    }
    function getNavigationUrl(navigationInfo) {
        let url = new URL(navigationInfo.action);
        if ((navigationInfo === null || navigationInfo === void 0 ? void 0 : navigationInfo.formData) && (navigationInfo === null || navigationInfo === void 0 ? void 0 : navigationInfo.method) === 'GET') {
            let formData = navigationInfo.formData;
            let searchParams = new URLSearchParams(formData);
            url.search = searchParams.toString();
        }
        return url;
    }

    function prettyPrintError(err) {
        let output = '';
        if (typeof err === 'string') {
            output = err;
        }
        else if (err instanceof Error) {
            output = err.message;
        }
        else if (err && typeof err.toString === 'function') {
            output = err.toString();
        }
        else if (err && typeof err.message === 'string') {
            output = err.message;
        }
        else {
            output = 'An unknown error occurred.';
        }
        return output;
    }

    /**
     * Function that combines some default morph behavior with custom behavior
     * @param options - The custom behavior to combine with the default behavior
     * @returns The combined morph behavior
     */
    function buildMorphConfig(options) {
        return Object.assign(Object.assign({}, options), { updating(el, toEl, childrenOnly, skip) {
                var _a;
                // Allow elements to opt-out of resetting their alpine state by adding the data-morph-children-only attribute
                if (el.hasAttribute && el.hasAttribute('data-morph-children-only')) {
                    childrenOnly();
                }
                // Allow elements to opt-out of morphing altogether with data-morph-skip
                if (el.hasAttribute && el.hasAttribute('data-morph-skip')) {
                    skip();
                }
                (_a = options === null || options === void 0 ? void 0 : options.updating) === null || _a === void 0 ? void 0 : _a.call(options, el, toEl, childrenOnly, skip);
            },
            removing(el, skip) {
                var _a;
                // Allow elements to opt-out of morphing altogether with data-morph-skip
                if (el.hasAttribute && el.hasAttribute('data-morph-skip')) {
                    skip();
                }
                (_a = options === null || options === void 0 ? void 0 : options.removing) === null || _a === void 0 ? void 0 : _a.call(options, el, skip);
            } });
    }

    class FetchBatcher {
        constructor(timeoutDuration = 100) {
            this.batchMap = new Map();
            this.timeoutMap = new Map();
            this.timeoutDuration = timeoutDuration;
            this.requestPromises = new Map();
        }
        // Main method to handle incoming requests
        request(url) {
            return new Promise((resolve, reject) => {
                const baseUrl = this.getBaseUrl(url);
                const queryParams = this.getQueryParams(url);
                const sectionsParam = queryParams
                    .getAll('sections')
                    .concat(queryParams.getAll('section_id'))
                    .concat(queryParams.getAll('sections[]'));
                if (!this.batchMap.has(baseUrl)) {
                    this.batchMap.set(baseUrl, new Set());
                }
                const sectionsSet = this.batchMap.get(baseUrl);
                if (sectionsSet) {
                    sectionsParam.forEach((section) => sectionsSet.add(section));
                }
                if (!this.requestPromises.has(baseUrl)) {
                    this.requestPromises.set(baseUrl, []);
                }
                const promisesList = this.requestPromises.get(baseUrl);
                if (promisesList) {
                    promisesList.push({ resolve, reject });
                }
                // Set a timeout to batch requests
                if (!this.timeoutMap.has(baseUrl)) {
                    const timeoutId = setTimeout(() => {
                        this.fetchBatch(baseUrl);
                    }, this.timeoutDuration);
                    this.timeoutMap.set(baseUrl, timeoutId);
                }
            });
        }
        // Extract base URL from full URL
        getBaseUrl(url) {
            const [baseUrl, _queryParams] = url.split('?');
            return baseUrl;
        }
        // Extract query parameters from full URL
        getQueryParams(url) {
            const [_baseUrl, queryParams] = url.split('?');
            return new URLSearchParams(queryParams);
        }
        // Construct the batched URL with all sections
        buildBatchUrl(baseUrl, sections) {
            return `${baseUrl}?sections=${Array.from(sections).join(',')}`;
        }
        // Fetch batched request
        async fetchBatch(baseUrl) {
            const sections = this.batchMap.get(baseUrl);
            if (!sections)
                return;
            const batchUrl = this.buildBatchUrl(baseUrl, sections);
            this.batchMap.delete(baseUrl);
            this.timeoutMap.delete(baseUrl);
            try {
                const response = await fetch(batchUrl);
                if (response.ok) {
                    const data = await response.json();
                    const requestPromises = this.requestPromises.get(baseUrl);
                    if (requestPromises) {
                        requestPromises.forEach(({ resolve }) => resolve(data));
                        this.requestPromises.delete(baseUrl);
                    }
                }
                else {
                    throw response.statusText;
                }
            }
            catch (error) {
                const requestPromises = this.requestPromises.get(baseUrl);
                if (requestPromises) {
                    requestPromises.forEach(({ reject }) => reject(error));
                    this.requestPromises.delete(baseUrl);
                }
            }
        }
    }

    var __rest = (undefined && undefined.__rest) || function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };
    const THEME_SECTION_CONTEXT_KEY = Symbol('THEME_SECTION_CONTEXT_KEY');
    const THEME_SECTION_FRAME_CONTEXT_KEY = Symbol('THEME_SECTION_FRAME_CONTEXT_KEY');
    const fetchBatcher = new FetchBatcher();
    const DEFAULT_MORPH_CONFIG = {
        updating(el, _toEl, _childrenOnly, skip) {
            // Skip any built-in shopify elements
            if (el.hasAttribute && el.hasAttribute('data-shopify')) {
                skip();
            }
        },
        removing(el, skip) {
            // Skip any built-in shopify elements
            if (el.hasAttribute && el.hasAttribute('data-shopify')) {
                skip();
            }
        },
    };
    var sectionApi = (options) => {
        let morphConfig = (options === null || options === void 0 ? void 0 : options.morphConfig) || DEFAULT_MORPH_CONFIG;
        return function (Alpine) {
            if ('morph' in Alpine === false) {
                throw new Error('The x-section-api directive requires the @alpinejs/morph plugin');
            }
            if (!Alpine.store('cache')) {
                throw new Error('The x-section-api directive requires the method-ui cache plugin');
            }
            if (!Alpine.store('cache').resources.sectionHtml) {
                Alpine.store('cache').addResource('sectionHtml');
            }
            Alpine.directive('section-api', ($el, data, utilities) => {
                if (!isHtmlElement($el)) {
                    throw new Error(`Expected HTMLElement but got ${$el}`);
                }
                if (data.value === 'frame') {
                    handleFrame($el, data, utilities, Alpine, morphConfig);
                }
                else if (data.value === 'form') {
                    handleForm($el, data, utilities, Alpine);
                }
                else if (data.value === 'link') {
                    handleLink($el, data, utilities, Alpine);
                }
                else if (data.value === null) {
                    handleRoot$1($el, data, utilities, Alpine, morphConfig);
                }
                else {
                    throw new Error(`Unknown directive: x-section-api:${data.value}`);
                }
            }).before('bind');
            Alpine.magic('sectionApi', handleSectionMagic(Alpine));
            Alpine.magic('sectionApiFrame', handleFrameMagic(Alpine));
            Alpine.magic('sectionApiCache', handleSectionCacheMagic(Alpine));
            bindAllThemeSections(Alpine, (el) => {
                // Add x-section-api directive to all sections making it possible to reload them via section rendering API with $sectionApi.load(...)
                const sectionIdForSectionRenderingApi = el.id.split('shopify-section-')[1]; // e.g. section-featured-product from shopify-section-section-featured-product
                Alpine.bind(el, {
                    ['x-section-api']: sectionIdForSectionRenderingApi,
                });
            });
        };
    };
    function handleSectionMagic(Alpine) {
        return function ($el) {
            const context = Alpine.$data($el)[THEME_SECTION_CONTEXT_KEY];
            return {
                get morphConfig() {
                    return context === null || context === void 0 ? void 0 : context.morphConfig;
                },
                set morphConfig(value) {
                    context.morphConfig = value;
                },
                get sectionId() {
                    return context === null || context === void 0 ? void 0 : context.sectionId;
                },
                get state() {
                    return context === null || context === void 0 ? void 0 : context.state;
                },
                get error() {
                    return context === null || context === void 0 ? void 0 : context.error;
                },
                update(options) {
                    return context === null || context === void 0 ? void 0 : context.update(options);
                },
                load(options) {
                    return context === null || context === void 0 ? void 0 : context.load(options);
                },
                navigate(url, historyMode) {
                    return context === null || context === void 0 ? void 0 : context.navigate(url, historyMode);
                },
                // subscribe() {
                //   return context?.subscribe();
                // },
                // unsubscribe() {
                //   return context?.unsubscribe();
                // },
            };
        };
    }
    function handleFrameMagic(Alpine) {
        return function ($el) {
            const context = Alpine.$data($el)[THEME_SECTION_FRAME_CONTEXT_KEY];
            return {
                get morphConfig() {
                    return context === null || context === void 0 ? void 0 : context.morphConfig;
                },
                set morphConfig(value) {
                    context.morphConfig = value;
                },
                get el() {
                    return context === null || context === void 0 ? void 0 : context.rootEl;
                },
                get state() {
                    return context === null || context === void 0 ? void 0 : context.state;
                },
                get error() {
                    return context === null || context === void 0 ? void 0 : context.error;
                },
                update(options) {
                    return context === null || context === void 0 ? void 0 : context.update(options);
                },
                load(options) {
                    return context === null || context === void 0 ? void 0 : context.load(options);
                },
            };
        };
    }
    function handleSectionCacheMagic(Alpine) {
        return function () {
            return {
                set(sectionId, html, options) {
                    const url = buildSectionUrl(sectionId, options);
                    Alpine.store('cache').resources.sectionHtml.set(url, html);
                },
                get(sectionId, options) {
                    const url = buildSectionUrl(sectionId, options);
                    return Alpine.store('cache').resources.sectionHtml.get(url);
                },
            };
        };
    }
    // TODO refactor this to use Alpine.morphBetween: https://github.com/alpinejs/alpine/blob/df63fe2f6eb416bb7f46c449f2ee6aaf3c0b304e/packages/morph/src/morph.js#L33
    function handleFrame($el, data, { cleanup }, Alpine, morphConfig) {
        const rootContext = Alpine.$data($el)[THEME_SECTION_CONTEXT_KEY];
        if (!rootContext)
            return;
        const sectionId = rootContext.sectionId;
        const frameContext = buildContext(Alpine, $el, sectionId, {
            targetId: $el.id,
            rootEl: rootContext.rootEl,
            morphConfig,
        });
        if (!$el.hasAttribute('id')) {
            throw new Error(`Elements using x-section-api:frame must have a unique id property`);
        }
        Alpine.addScopeToNode($el, {
            [THEME_SECTION_FRAME_CONTEXT_KEY]: frameContext,
        });
        $el._x_sectionApi_isFrame = true;
        $el._x_sectionApi_isIsolatedFrame = data.modifiers.includes('isolate');
        cleanup(() => {
            var _a;
            // Abort any pending fetches when element is removed from DOM
            (_a = frameContext.abortController) === null || _a === void 0 ? void 0 : _a.abort();
            // Delete custom properties from element
            delete $el._x_sectionApi_isFrame;
            delete $el._x_sectionApi_isIsolatedFrame;
        });
    }
    function handleForm($el, data, _utilities, Alpine) {
        if (!isFormElement($el)) {
            throw new Error('x-section-api:form directive can only be used on form elements');
        }
        if ($el.method.toLowerCase() == 'post') {
            throw new Error('x-section-api:form directive does not support POST requests');
        }
        Alpine.bind($el, {
            [`x-router:form.${data.modifiers}`]: '',
        });
    }
    function handleLink($el, data, _utilities, Alpine) {
        if (!isAnchorElement($el)) {
            throw new Error('x-section-api:link directive can only be used on anchor elements');
        }
        Alpine.bind($el, {
            [`x-router:link.${data.modifiers}`]: '',
        });
    }
    function handleRoot$1($el, data, { cleanup }, Alpine, morphConfig) {
        // Grab section id from directive expression
        const sectionId = data.expression;
        const context = buildContext(Alpine, $el, sectionId, { morphConfig });
        // Section will update automatically when the section HTML is updated
        // const subscribe = data.modifiers.includes('subscribe');
        Alpine.addScopeToNode($el, {
            [THEME_SECTION_CONTEXT_KEY]: context,
        });
        // if (subscribe) {
        //   context.subscribe();
        // }
        Alpine.bind($el, {
            'aria-atomic': 'true',
            [':aria-busy']() {
                return context.state == 'loading';
            },
            [`x-router`]() {
                return async (url) => {
                    const baseUrl = `${url.pathname}${url.search}`;
                    window.dispatchEvent(new CustomEvent('theme:section:navigate', {
                        detail: {
                            sectionId,
                            url: baseUrl,
                        },
                    }));
                    return context.update({ baseUrl });
                };
            },
        });
        cleanup(() => {
            var _a;
            // Abort any pending fetches when element is removed from DOM
            (_a = context.abortController) === null || _a === void 0 ? void 0 : _a.abort();
            // context.unsubscribe();
        });
    }
    function buildContext(Alpine, $el, sectionId, options) {
        return Alpine.reactive({
            rootEl: (options === null || options === void 0 ? void 0 : options.rootEl) || $el,
            state: 'initial',
            error: null,
            targetId: (options === null || options === void 0 ? void 0 : options.targetId) || null,
            sectionId,
            pendingUrl: null,
            abortController: null,
            subscription: null,
            morphConfig: (options === null || options === void 0 ? void 0 : options.morphConfig) || DEFAULT_MORPH_CONFIG,
            buildUrl(options) {
                var _a;
                return buildSectionUrl((_a = options === null || options === void 0 ? void 0 : options.sectionId) !== null && _a !== void 0 ? _a : this.sectionId, Object.assign(Object.assign({}, options), { targetId: this.targetId }));
            },
            update: async function (options) {
                const _update = async () => {
                    var _a;
                    const cachePolicy = (_a = options === null || options === void 0 ? void 0 : options.cachePolicy) !== null && _a !== void 0 ? _a : 'cache-and-network';
                    if (cachePolicy == 'cache-only') {
                        const cachedHtml = Alpine.store('cache').resources.sectionHtml.get(this.buildUrl(options));
                        if (cachedHtml) {
                            this.updateHtml(cachedHtml, { mode: options === null || options === void 0 ? void 0 : options.htmlMode, morphConfig: options === null || options === void 0 ? void 0 : options.morphConfig });
                        }
                        return cachedHtml;
                    }
                    else if (cachePolicy == 'network-only') {
                        const updatedHtml = await this.load(options);
                        if (updatedHtml) {
                            this.updateHtml(updatedHtml, { mode: options === null || options === void 0 ? void 0 : options.htmlMode, morphConfig: options === null || options === void 0 ? void 0 : options.morphConfig });
                        }
                        return updatedHtml;
                    }
                    else if (cachePolicy == 'cache-first') {
                        const cachedHtml = Alpine.store('cache').resources.sectionHtml.get(this.buildUrl(options));
                        if (cachedHtml) {
                            this.updateHtml(cachedHtml, { mode: options === null || options === void 0 ? void 0 : options.htmlMode, morphConfig: options === null || options === void 0 ? void 0 : options.morphConfig });
                            return cachedHtml;
                        }
                        else {
                            const updatedHtml = await this.load(options);
                            if (updatedHtml) {
                                this.updateHtml(updatedHtml, { mode: options === null || options === void 0 ? void 0 : options.htmlMode, morphConfig: options === null || options === void 0 ? void 0 : options.morphConfig });
                            }
                            return updatedHtml;
                        }
                    }
                    else if (cachePolicy == 'cache-and-network') {
                        const cachedHtml = Alpine.store('cache').resources.sectionHtml.get(this.buildUrl(options));
                        if (cachedHtml) {
                            this.updateHtml(cachedHtml, { mode: options === null || options === void 0 ? void 0 : options.htmlMode, morphConfig: options === null || options === void 0 ? void 0 : options.morphConfig });
                        }
                        const updatedHtml = await this.load(options);
                        if (updatedHtml) {
                            this.updateHtml(updatedHtml, { mode: options === null || options === void 0 ? void 0 : options.htmlMode, morphConfig: options === null || options === void 0 ? void 0 : options.morphConfig });
                        }
                        return updatedHtml;
                    }
                    else {
                        throw new Error(`Unknown cache policy: ${cachePolicy}`);
                    }
                };
                if (options === null || options === void 0 ? void 0 : options.waitForIdle) {
                    return new Promise(async (resolve) => {
                        window.requestIdleCallback(async () => {
                            const result = await _update();
                            resolve(result);
                        });
                    });
                }
                else {
                    return _update();
                }
            },
            load: async function (options) {
                var _a;
                try {
                    const _b = options || {}, { url, baseUrl, sectionId, batch } = _b, fetchOptions = __rest(_b, ["url", "baseUrl", "sectionId", "batch"]);
                    // Allow overriding the section rendering API for a single request
                    const requestUrl = url !== null && url !== void 0 ? url : this.buildUrl({ baseUrl, sectionId });
                    this.state = 'loading';
                    window.dispatchEvent(new CustomEvent('theme:section:load', { detail: { sectionId: this.sectionId } }));
                    this.pendingUrl = requestUrl;
                    if (batch) {
                        const result = await fetchBatcher.request(requestUrl);
                        // Grab the HTML for this section from the batch result
                        const html = result[this.sectionId];
                        // Store that HTML in the cache
                        Alpine.store('cache').resources.sectionHtml.set(this.buildUrl({ baseUrl, sectionId }), html);
                        this.state = 'loaded';
                        return html;
                    }
                    else {
                        if ((options === null || options === void 0 ? void 0 : options.abortPending) != false) {
                            (_a = this.abortController) === null || _a === void 0 ? void 0 : _a.abort();
                        }
                        this.abortController = new AbortController();
                        const result = await fetch(requestUrl, Object.assign({ signal: this.abortController.signal }, fetchOptions));
                        // TODO figure out what to do in error cases, right now we just throw an error...
                        if (!result.ok) {
                            throw new Error(result.statusText);
                        }
                        const responseHtml = await result.text();
                        Alpine.store('cache').resources.sectionHtml.set(this.buildUrl({ baseUrl, sectionId }), responseHtml);
                        this.state = 'loaded';
                        return responseHtml;
                    }
                }
                catch (e) {
                    if (e.name == 'AbortError') ;
                    else {
                        // Update state so UI can display error
                        this.state = 'error';
                        this.error = prettyPrintError(e);
                        throw e;
                    }
                }
                finally {
                    this.pendingUrl = null;
                }
            },
            navigate: async function (url, historyMode) {
                const $data = Alpine.$data($el);
                return $data.$router.navigate(url, historyMode);
            },
            // TODO implement subscriptions, and ensure they can't cause infinite loops
            // subscribe(options) {
            //   this.subscription = Alpine.effect(() => {
            //     const subscriptionUrl = this.buildUrl(options);
            //     const html = Alpine.store('cache').resources.sectionHtml.get(subscriptionUrl);
            //     if (typeof html == 'string') {
            //       this.updateHtml(html, {mode: options?.htmlMode});
            //     }
            //   });
            // },
            // unsubscribe() {
            //   if (this.subscription) {
            //     Alpine.release(this.subscription);
            //     this.subscription = null;
            //   }
            // },
            updateHtml(html, options) {
                var _a;
                // Shopify inserts an extra comment when using section rendering API in the theme editor which
                // breaks the morphing process. This removes it.
                const sanitizedHtml = html.replace(/<!--shopify:rendered_by_section_api-->/g, '');
                const morphConfig = (_a = options === null || options === void 0 ? void 0 : options.morphConfig) !== null && _a !== void 0 ? _a : this.morphConfig;
                if ((options === null || options === void 0 ? void 0 : options.mode) == 'replace') {
                    Alpine.mutateDom(() => {
                        this.rootEl.innerHTML = sanitizedHtml;
                        // Re-initialize alpine on cloned node
                        Alpine.skipDuringClone(() => Alpine.initTree(this.rootEl))();
                    });
                }
                else {
                    Alpine.morph(this.rootEl, sanitizedHtml, buildMorphConfig({
                        updating: (fromEl, toEl, childrenOnly, skip) => {
                            var _a;
                            if (isHtmlElement(fromEl) && isHtmlElement(toEl)) {
                                if (fromEl == this.rootEl) {
                                    // Skip morphing the root section el itself, only morph children
                                    childrenOnly();
                                }
                                else {
                                    // Check if the directive element is a frame or a section
                                    if ($el._x_sectionApi_isFrame) {
                                        if (fromEl._x_sectionApi_isFrame) {
                                            if (this.targetId == fromEl.id) {
                                                // Skip morphing the frame section el itself, only morph children
                                                childrenOnly();
                                            }
                                            else {
                                                // Skip updating other frames
                                                skip();
                                            }
                                        }
                                        else if (!fromEl.contains($el) && !$el.contains(fromEl)) {
                                            // Skip any element which is not part of the frame's tree
                                            skip();
                                        }
                                    }
                                    else {
                                        // Skip updating isolated frames inside of sections
                                        if (fromEl._x_sectionApi_isFrame && fromEl._x_sectionApi_isIsolatedFrame) {
                                            skip();
                                        }
                                    }
                                }
                                (_a = morphConfig === null || morphConfig === void 0 ? void 0 : morphConfig.updating) === null || _a === void 0 ? void 0 : _a.call(morphConfig, fromEl, toEl, childrenOnly, skip);
                            }
                        },
                        updated: morphConfig === null || morphConfig === void 0 ? void 0 : morphConfig.updated,
                        removing: morphConfig === null || morphConfig === void 0 ? void 0 : morphConfig.removing,
                        removed: morphConfig === null || morphConfig === void 0 ? void 0 : morphConfig.removed,
                        adding: morphConfig === null || morphConfig === void 0 ? void 0 : morphConfig.adding,
                        added: morphConfig === null || morphConfig === void 0 ? void 0 : morphConfig.added,
                    }));
                }
                window.dispatchEvent(new CustomEvent('theme:section:update', { detail: { sectionId: this.sectionId } }));
            },
        });
    }
    function buildSectionUrl(sectionId, options) {
        var _a, _b, _c;
        const DEFAULT_BASE_URL = ((_b = (_a = window.theme) === null || _a === void 0 ? void 0 : _a.routes) === null || _b === void 0 ? void 0 : _b.root) || '/';
        // This is such an ugly hack but unfortunately necessary until this is fixed: https://github.com/whatwg/url/issues/531
        const FAKE_HOST = 'https://fake-host';
        const fullUrl = new URL((_c = options === null || options === void 0 ? void 0 : options.baseUrl) !== null && _c !== void 0 ? _c : DEFAULT_BASE_URL, FAKE_HOST);
        let sanitizedSectionId;
        // Handle case of section ID from section DOM element being passed in (i.e. prepended with 'shopify-section-')
        if (sectionId.startsWith('shopify-section-')) {
            sanitizedSectionId = sectionId.split('shopify-section-')[1];
        }
        else {
            sanitizedSectionId = sectionId;
        }
        if (options === null || options === void 0 ? void 0 : options.targetId) {
            fullUrl.hash = options.targetId;
        }
        fullUrl.searchParams.append('section_id', sanitizedSectionId);
        return fullUrl.toString().replace(FAKE_HOST, '');
    }

    (undefined && undefined.__rest) || function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    /**
     * Enables the creation of stepper components.
     * The 'x-stepper' directive provide functionality for managing stepper input fields.
     *
     * x-stepper -  The root element of the stepper, initializing the stepper functionality and adding a data context for child directives. Use the 'modal' modifier (x-dialog.modal) to make the dialog modal.
     * x-stepper:input - The input element
     * x-stepper:minus - The minus button
     * x-stepper:plus - The plus button
     *
     * @example
     *
      <div x-stepper>
        <button type="button" x-stepper:minus>−</button>
        <input type="number" name="stepper" min="1" max="10" value="1" x-stepper:input>
        <button type="button" x-stepper:plus>+</button>
      </div>

     */
    function stepper (Alpine) {
        Alpine.directive('stepper', ($el, data) => {
            if (data.value == 'input') {
                handleInput($el, Alpine);
            }
            else if (data.value == 'minus') {
                handleButtonMinus($el, Alpine);
            }
            else if (data.value == 'plus') {
                handleButtonPlus($el, Alpine);
            }
            else if (data.value == null) {
                handleRoot($el, Alpine);
            }
            else {
                throw new Error(`Unknown directive: x-stepper:${data.value}`);
            }
        }).before('bind');
        Alpine.magic('stepper', ($el) => {
            const $data = Alpine.$data($el);
            return {
                value: $data.__stepper_value,
            };
        });
    }
    function handleInput($el, Alpine) {
        if (isInputNumberElement($el)) {
            const $data = Alpine.$data($el);
            $data.__stepper_min = Number($el.min);
            $data.__stepper_max = $el.max ? Number($el.max) : null;
            Alpine.bind($el, {
                'x-init': '__stepper_input = $el',
                'x-model.fill.number': '__stepper_value',
            });
        }
        else {
            throw new Error(`Expected <input type="number"> tag for x-stepper:input but got ${$el}`);
        }
    }
    function handleButtonMinus($el, Alpine) {
        if (isButtonElement($el)) {
            Alpine.bind($el, {
                '@click.prevent'() {
                    this.__stepper_decrement();
                },
                ':disabled': '__stepper_isAtMin',
            });
        }
        else {
            throw new Error(`Expected <button> tag for x-stepper:minus but got ${$el}`);
        }
    }
    function handleButtonPlus($el, Alpine) {
        if (isButtonElement($el)) {
            Alpine.bind($el, {
                '@click.prevent'() {
                    this.__stepper_increment();
                },
                ':disabled': '__stepper_isAtMax',
            });
        }
        else {
            throw new Error(`Expected <button> tag for x-stepper:plus but got ${$el}`);
        }
    }
    function handleRoot($el, Alpine) {
        Alpine.bind($el, {
            ['x-data']() {
                return stepper$1();
            },
            'x-modelable': '__stepper_value',
            '@click.self'() {
                var _a;
                (_a = this.__stepper_input) === null || _a === void 0 ? void 0 : _a.focus();
            },
        });
    }
    function stepper$1() {
        return {
            __stepper_input: null,
            __stepper_min: 0,
            __stepper_max: null,
            __stepper_value: null,
            get __stepper_isAtMin() {
                return this.__stepper_min === this.__stepper_value;
            },
            get __stepper_isAtMax() {
                return this.__stepper_max === this.__stepper_value;
            },
            __stepper_decrement() {
                var _a, _b;
                if ((_a = this.__stepper_input) === null || _a === void 0 ? void 0 : _a.disabled)
                    return;
                (_b = this.__stepper_input) === null || _b === void 0 ? void 0 : _b.stepDown();
                this.__stepper_updateValue();
                this.$dispatch('decrement', this.__stepper_value);
            },
            __stepper_increment() {
                var _a, _b;
                if ((_a = this.__stepper_input) === null || _a === void 0 ? void 0 : _a.disabled)
                    return;
                (_b = this.__stepper_input) === null || _b === void 0 ? void 0 : _b.stepUp();
                this.__stepper_updateValue();
                this.$dispatch('increment', this.__stepper_value);
            },
            __stepper_updateValue() {
                var _a;
                this.__stepper_value = Number((_a = this.__stepper_input) === null || _a === void 0 ? void 0 : _a.value) || 0;
            },
        };
    }

    function clone (Alpine) {
        Alpine.directive('clone', ($targetEl, { expression }, { effect, evaluateLater, cleanup }) => {
            // Function which will evaluate to the source element that will be cloned into the target element
            const sourceElFn = evaluateLater(expression);
            if (!isHtmlElement($targetEl)) {
                throw new Error(`Expected HTMLElement but got ${$targetEl}`);
            }
            $targetEl._x_insertClone = (sourceEl) => {
                var _a;
                if (!isHtmlElement(sourceEl))
                    return;
                if (!isTemplateElement($targetEl)) {
                    throw new Error(`x-clone can only be used on a <template> tag`);
                }
                if ($targetEl._x_clonedElement) {
                    (_a = $targetEl._x_undoClone) === null || _a === void 0 ? void 0 : _a.call($targetEl);
                }
                let clone = isTemplateElement(sourceEl)
                    ? sourceEl.content.cloneNode(true).firstElementChild
                    : sourceEl.cloneNode(true);
                if (!clone)
                    return;
                // Add new parent element's scope to cloned element
                Alpine.addScopeToNode(clone, {}, $targetEl);
                Alpine.mutateDom(() => {
                    // Insert cloned node after element with x-clone attribute
                    $targetEl.after(clone);
                    // Re-initialize alpine on cloned node
                    Alpine.skipDuringClone(() => Alpine.initTree(clone))();
                });
                $targetEl._x_clonedElement = clone;
                $targetEl._x_undoClone = () => {
                    Alpine.destroyTree(clone);
                    clone.remove();
                    delete $targetEl._x_clonedElement;
                };
            };
            effect(() => {
                sourceElFn(($sourceEl) => {
                    $targetEl._x_insertClone($sourceEl);
                });
            });
            cleanup(() => $targetEl._x_undoClone && $targetEl._x_undoClone());
        }).before('bind');
        Alpine.magic('clone', ($el) => {
            return $el._x_insertClone;
        });
    }

    /**
     * Checks the device resolution/touch
     * -----------------------------------------------------------------------------
     *
     * Ensures that we always know if we are using a Touch, Mobile, Tablet, or Desktop device.
     *
     * if (resolution.isMobile) {}
     *
     * It refreshes dynamically. We can also check when that happens by using the onChange method:
     *
     * resolution.onChange(() => {
     *  // only triggers once when we hop between different media screen sizes
     *  // for example, from Mobile(<= 768px) to Tablet(>= 769px and <=1100px)
     *  // or from Tablet(>= 769px and <=1100px) to Desktop(>=1101px)
     *
     *  if (resolution.isMobile() || resolution.isTouch()) {}
     * });
     *
     */

    function resolution() {
      const touchQuery = `(any-pointer: coarse) and (hover: none)`;
      const mobileQuery = `(max-width: ${window.theme.sizes.medium}px)`;
      const tabletQuery = `(min-width: ${window.theme.sizes.medium + 1}px) and (max-width: ${window.theme.sizes.large}px)`;
      const desktopQuery = `(min-width: ${window.theme.sizes.large + 1}px)`;

      resolution.isTouch = () => {
        const touchMatches = window.matchMedia(touchQuery).matches;
        document.documentElement.classList.toggle('supports-touch', touchMatches);
        return touchMatches;
      };
      resolution.isMobile = () => window.matchMedia(mobileQuery).matches;
      resolution.isTablet = () => window.matchMedia(tabletQuery).matches;
      resolution.isDesktop = () => window.matchMedia(desktopQuery).matches;

      const queries = [
        [touchQuery, resolution.isTouch],
        [mobileQuery, resolution.isMobile],
        [tabletQuery, resolution.isTablet],
        [desktopQuery, resolution.isDesktop],
      ];

      resolution.onChange = (callback) => {
        queries.forEach((query) => {
          window.matchMedia(query[0]).addEventListener('change', () => {
            if (query[1]() && callback) callback();
          });
        });
      };
    }

    resolution();

    const selectors = {
      productSlideshow: '[data-product-slideshow-style="thumbnails"]',
      productMedia: '[data-product-slideshow]',
    };

    /*
    NOTE this is an initial crack at migrating existing product instant add logic
    from WebComponents / direct DOM manipulation style to using Alpine. As such, it is
    fairly rough and not at all (yet) idiomatic Alpine.
    */

    function productForm() {
      return {
        quantity: 1,
        variantId: null,

        async changeVariant(variantUrl, newVariantId, variantMediaId) {
          if (newVariantId !== null && newVariantId !== undefined) {
            this.variantId = newVariantId;
          }
          if (this.$el.closest('[data-enable-history-state]')?.dataset.enableHistoryState == 'false') {
            await this.$sectionApi.navigate(variantUrl, 'none');
          } else {
            await this.$sectionApi.navigate(variantUrl, 'replace');
          }

          this.updateProductImage(variantMediaId);
        },

        updateProductImage(variantMediaId) {
          const desktopOrTablet = resolution.isDesktop() || resolution.isTablet();

          if (this.hasSlideshow && desktopOrTablet) {
            // If it's flickity on Desktop
            if (variantMediaId) {
              this.onSlideshowReady(() => {
                this.slideshow.dispatchEvent(new CustomEvent('theme:image:change', {detail: {id: variantMediaId}}));
              });
            }
          } else {
            // Desktop Grid/Mosaic or Mobile view(with regular horizontal scroll)
            const selectedImage = this.productMedia.querySelector(`[data-media-id="${variantMediaId}"]`);
            selectedImage?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
          }
        },

        async preloadVariant(variantUrl) {
          // cache-first policy prevents preloading multiple times when the same variant is added to the cart multiple times
          // abortPending prevents aborting other preload requests when one is already pending
          window.requestIdleCallback(() => {
            return this.$sectionApi.load({baseUrl: variantUrl, cachePolicy: 'cache-first', abortPending: false});
          });
        },

        get hasSlideshow() {
          return Boolean(document.body.querySelector(selectors.productSlideshow));
        },

        get slideshow() {
          return document.body.querySelector(selectors.productSlideshow);
        },

        get productMedia() {
          return document.body.querySelector(selectors.productMedia);
        },

        onSlideshowReady(callback) {
          if (this.slideshow.classList.contains('flickity-enabled')) {
            callback();
          } else {
            const mutationObserver = new MutationObserver((mutationList) => {
              for (const item of mutationList) {
                if (item.attributeName === 'class') {
                  if (this.slideshow.classList.contains('flickity-enabled')) {
                    mutationObserver.disconnect();
                    callback();
                    break;
                  }
                }
              }
            });
            mutationObserver.observe(this.slideshow, {attributes: true});
          }
        },

        // Initialization

        init() {
          const section = this.$el.closest('[data-section-type]');

          // Only update the image for Desktop slideshow or Mobile(where the media has a horizontal scrollbar)
          if (this.hasSlideshow || resolution.isMobile()) {
            const initialVariantMediaId = section?.dataset.initialVariantMediaId;
            if (initialVariantMediaId !== null) this.updateProductImage(initialVariantMediaId);
          }

          const handle = section?.dataset.productHandle;

          if (handle) {
            new RecordRecentlyViewed(handle);
          }
        },
      };
    }

    /* Data */

    module_default.data('productForm', productForm);

    /* Plugins */

    module_default.plugin(module_default$2);
    module_default.plugin(module_default$1);

    module_default.plugin(asyncForm);
    module_default.plugin(asyncLink);
    module_default.plugin(cache);
    module_default.plugin(clone);
    module_default.plugin(router);
    module_default.plugin(stepper);

    function isInProductForm(el) {
      return el.hasAttribute && el.closest('.shopify-product-form');
    }

    function isSellingPlanHiddenInput(el) {
      return el.tagName === 'INPUT' && el.type === 'hidden' && el.name === 'selling_plan';
    }

    module_default.plugin(
      sectionApi({
        morphConfig: {
          // Customize theme-wide section morphing behaviour here

          updating(el, toEl, childrenOnly, skip) {
            // Call `skip()` to prevent an element from being removed
            // Call `childrenOnly()` to prevent an element from being updated but allow it's children to be updated

            // Skip any built-in shopify elements
            if (el.hasAttribute && el.hasAttribute('data-shopify')) {
              skip();
            }

            // Skip updating selling_plan hidden input in product form to prevent breaking apps like Recharge. You may want to update or remove this logic depending on your theme's needs
            if (isInProductForm(el) && isSellingPlanHiddenInput(el)) {
              skip();
            }

            // Uncomment to skip updating variant id hidden input in product form. Most themes will not need this, but if you do, you can uncomment this line.
            // if (isInProductForm(el) && isVariantIdHiddenInput(el)) {
            //   skip();
            // }
          },
          // updated(el) {
          //   // Do something after an element was updated
          // },
          removing(el, skip) {
            // Call `skip()` to prevent an element from being removed

            // Skip any built-in shopify elements
            if (el.hasAttribute && el.hasAttribute('data-shopify')) {
              debugger;
              skip();
            }

            // Skip removing selling_plan hidden input in product form to prevent breaking apps like Recharge. You may want to update or remove this logic depending on your theme's needs
            if (isInProductForm(el) && isSellingPlanHiddenInput(el)) {
              skip();
            }
          },
          // removed(el) {
          //   // Do something after an element was removed
          // },
          // adding(el, skip) {
          //   // Call `skip()` to prevent a new element from being added
          // },
          // added(el) {
          //   // Do something after a new element was added
          // }
        },
      })
    );

    /* Initialization */

    module_default.start();

    // Mainly for Alpine.js devtools to work
    window.Alpine = module_default;

})(themeVendor.ScrollLock, themeVendor.FlickityFade, themeVendor.themeCurrency, themeVendor.themeAddresses, themeVendor.Sqrl, themeVendor.axios, themeVendor.Flickity, themeVendor.MicroModal, themeVendor.Rellax, themeVendor.FlickitySync);
