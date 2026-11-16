/**
 * Main Page Data Mapper
 * main.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 main 페이지 특화 기능 제공
 */
class MainMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 MAIN PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Main 페이지 Hero 섹션 매핑 (텍스트 + 슬라이더)
     */
    mapMainHeroSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        // Hero 텍스트 매핑
        this.mapMainHeroText();

        // Hero 슬라이더 이미지 매핑
        this.mapMainHeroSlider();
    }

    /**
     * Main 페이지 Hero 텍스트만 매핑 (제목, 설명)
     */
    mapMainHeroText() {
        if (!this.isDataLoaded || !this.data.property) return;


        // main 페이지의 hero 데이터 가져오기
        const mainHeroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');

        // data-main-title 매핑
        const mainTitleElement = this.safeSelect('[data-main-title]');
        if (mainTitleElement && mainHeroData && mainHeroData.title !== undefined) {
            mainTitleElement.textContent = mainHeroData.title;
        }

        // data-main-description 매핑
        const mainDescriptionElement = this.safeSelect('[data-main-description]');
        if (mainDescriptionElement && mainHeroData && mainHeroData.description !== undefined) {
            mainDescriptionElement.innerHTML = mainHeroData.description.replace(/\n/g, '<br>');
        }

        // 펜션 이름 매핑 - main 페이지의 hero.title 사용
        const propertyNameElement = this.safeSelect('[data-main-property-name]');
        if (propertyNameElement && mainHeroData && mainHeroData.title !== undefined) {
            propertyNameElement.textContent = mainHeroData.title;
        }

        // Hero 설명 매핑 - main 페이지의 hero.description 사용
        const heroDescriptionElement = this.safeSelect('[data-main-hero-description]');
        if (heroDescriptionElement && mainHeroData && mainHeroData.description !== undefined) {
            heroDescriptionElement.innerHTML = mainHeroData.description.replace(/\n/g, '<br>');
        }
    }

    /**
     * Main 페이지 Hero 이미지 매핑 (단일 배경 이미지)
     */
    mapMainHeroSlider() {
        if (!this.isDataLoaded) return;
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');
        const slider = this.safeSelect('[data-main-hero-slider]');
        const nav = this.safeSelect('[data-main-hero-nav]');
        if (!slider) return;

        // 관리자 미리보기에서 재매핑할 때 기존 타이머와 이벤트를 정리한다.
        if (window.mainHeroSlider) {
            window.mainHeroSlider.destroy();
            window.mainHeroSlider = null;
        }
        const images = Array.isArray(heroData?.images)
            ? heroData.images.filter(img => img && img.isSelected && img.url)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            : [];
        slider.replaceChildren();
        const displayImages = images.length ? images : [null];
        displayImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide' + (index === 0 ? ' active' : '');
            const img = document.createElement('img');
            if (image) {
                img.src = image.url;
                img.alt = image.description || image.title || '메인 배경';
            } else {
                ImageHelpers.applyPlaceholder(img);
            }
            slide.appendChild(img);
            slider.appendChild(slide);
        });
        if (nav) nav.hidden = images.length < 2;
        if (images.length > 1 && window.SliderModule) {
            window.mainHeroSlider = window.SliderModule.initializeSlider('#main-hero-slider', {
                controlsContainer: slider.closest('.hero-section'),
                slideInterval: 5000,
                skipInitialDelay: true,
                touchEnabled: false,
            });
        }
    }

    /**
     * Main 페이지 콘텐츠 섹션 동적 생성
     */
    mapMainContentSections() {
        if (!this.isDataLoaded) return;

        // JSON의 about 섹션 데이터 가져오기
        const aboutSections = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.about');

        if (!aboutSections || !Array.isArray(aboutSections) || aboutSections.length === 0) {
            return;
        }

        // 기존 하드코딩된 .main-content-wrapper 찾기 또는 생성
        let contentWrapper = document.querySelector('.main-content-wrapper');

        if (!contentWrapper) {
            // location-info-section 다음에 wrapper 삽입
            const locationSection = document.querySelector('.location-info-section');
            if (locationSection) {
                contentWrapper = document.createElement('div');
                contentWrapper.className = 'main-content-wrapper';
                locationSection.parentNode.insertBefore(contentWrapper, locationSection.nextSibling);
            }
        } else {
            // 기존 하드코딩된 섹션들 제거
            contentWrapper.innerHTML = '';
        }

        if (!contentWrapper) return;

        // DocumentFragment 사용으로 DOM 조작 최적화
        const fragment = document.createDocumentFragment();

        aboutSections.forEach((aboutSection, index) => {
            const selectedImages = aboutSection.images
                ? aboutSection.images.filter(img => img.isSelected).sort((a, b) => a.sortOrder - b.sortOrder)
                : [];

            // 섹션 1: 텍스트 + 이미지 반반 섹션
            const textImageSection = this.createTextImageSection(aboutSection, selectedImages[0], index);
            fragment.appendChild(textImageSection);

            // 섹션 2: 단일 이미지 섹션
            if (selectedImages[1]) {
                const singleImageSection = this.createSingleImageSection(selectedImages[1]);
                fragment.appendChild(singleImageSection);
            }
        });

        contentWrapper.appendChild(fragment);
    }




    /**
     * 텍스트 + 이미지 섹션 생성 (반반 나눠진 레이아웃)
     */
    createTextImageSection(aboutSection, image, index) {
        const section = document.createElement('section');
        section.className = 'main-content-fade-in';

        const title = aboutSection.title || '';
        const description = aboutSection.description || '';
        const propertyNameEn = this.data.property?.nameEn || '';

        // Property name element
        const propertyNameDiv = document.createElement('div');
        propertyNameDiv.className = 'gallery-property-english-name';
        propertyNameDiv.setAttribute('data-property-name-en', '');
        propertyNameDiv.textContent = propertyNameEn;

        // Hero bottom section
        const heroBottomSection = document.createElement('div');
        heroBottomSection.className = 'hero-bottom-section';

        // Image half
        const heroImageHalf = document.createElement('div');
        heroImageHalf.className = 'hero-image-half';

        const img = document.createElement('img');
        if (image?.url) {
            img.src = image.url;
            img.alt = image.description || title || '메인 히어로 이미지';
        } else {
            img.src = ImageHelpers.EMPTY_IMAGE_SVG;
            img.alt = 'No Image Available';
            img.className = 'empty-image-placeholder';
        }

        heroImageHalf.appendChild(img);

        // Text half
        const heroTextHalf = document.createElement('div');
        heroTextHalf.className = 'hero-text-half';

        const heroTextContent = document.createElement('div');
        heroTextContent.className = 'hero-text-content';

        const h3 = document.createElement('h3');
        h3.className = 'hero-sub-title';
        h3.textContent = title;

        const p = document.createElement('p');
        p.className = 'hero-sub-description';
        p.textContent = description;

        heroTextContent.appendChild(h3);
        heroTextContent.appendChild(p);
        heroTextHalf.appendChild(heroTextContent);

        // 짝수 인덱스: 이미지 왼쪽, 텍스트 오른쪽
        // 홀수 인덱스: 텍스트 왼쪽, 이미지 오른쪽
        if (index % 2 === 0) {
            heroBottomSection.appendChild(heroImageHalf);
            heroBottomSection.appendChild(heroTextHalf);
        } else {
            heroBottomSection.appendChild(heroTextHalf);
            heroBottomSection.appendChild(heroImageHalf);
        }

        section.appendChild(propertyNameDiv);
        section.appendChild(heroBottomSection);

        return section;
    }

    /**
     * 단일 이미지 섹션 생성
     */
    createSingleImageSection(image) {
        const section = document.createElement('section');
        section.className = 'main-content-fade-in';

        const heroBottomSection = document.createElement('div');
        heroBottomSection.className = 'hero-bottom-section';

        const img = document.createElement('img');
        if (image?.url) {
            img.src = image.url;
            img.alt = image.description || '메인 히어로 이미지';
        } else {
            img.src = ImageHelpers.EMPTY_IMAGE_SVG;
            img.alt = 'No Image Available';
            img.className = 'empty-image-placeholder';
        }

        heroBottomSection.appendChild(img);
        section.appendChild(heroBottomSection);

        return section;
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Main 페이지 전체 매핑 실행 (base-mapper.js에서 자동 호출)
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map main page: data not loaded');
            return;
        }

        // Main 페이지 섹션들 순차 매핑
        this.mapMainHeroSection();
        this.mapMainContentSections();
        this.updateMetaTags();
        this.reinitializeScrollAnimations();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainMapper;
} else {
    window.MainMapper = MainMapper;
}

// 자동 초기화 및 window.baseMapper 등록
(function() {
    'use strict';

    // 페이지 로드 완료 후 매퍼 초기화
    function initMapper() {
        // PreviewHandler가 이미 존재하면 초기화하지 않음 (PreviewHandler가 처리)
        if (window.previewHandler) {
            console.log('✅ PreviewHandler detected, skipping auto-initialization');
            return;
        }

        // 일반 초기화 (JSON 파일 로드)
        const mapper = new MainMapper();
        window.baseMapper = mapper;
        mapper.initialize();
        console.log('✅ MainMapper initialized');
    }

    // DOMContentLoaded 이후에 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapper);
    } else {
        initMapper();
    }
})();
