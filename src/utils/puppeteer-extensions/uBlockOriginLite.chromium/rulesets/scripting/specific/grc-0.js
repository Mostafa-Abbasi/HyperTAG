/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2019-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

/* jshint esversion:11 */

'use strict';

// ruleset: grc-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = [".adResult",".ad_wrapper",".pub_300x250,\n.pub_300x250m,\n.pub_728x90,\n.text-ad,\n.text-ad-links,\n.text-ads,\n.textAd,\n.text_ad,\n.text_ads","#mainBanner,\n.LeftMenuAd,\n.adForumAdDiv","DIV[id=\"MaxFooterBannerCon\"]","A[href=\"http://www.amnizia.com/advertisement\"],\nA[href=\"http://www.elcid.com/\"],\nA[href=\"http://www.text-link-ads.com/\"]","TABLE#bannerLandscape","#crosscol-overflow",".widget-content","DIV#HTML14,\nDIV#HTML15",".skinBanner,\n.sw-banner,\nvideo","#af-preloader,\n.adsbygoogle,\n.theiaStickySidebar","DIV[id=\"floatit\"]","P[style=\"color: rgb(255, 0, 0);\"],\ntd[class=\"message-box\"]","[href^=\"https://gml-grp.com/C.ashx\"]",".is-relative.extra-sidebar","A[href*=\"spinpalace\"]","#\\5f widget-5,\n#text-202339834,\nA[href*=\"http://www.ez-smoke.net/\"],\nA[href*=\"http://www.indolucky7.com/sbobet/sbobet.html\"],\nA[href=\"http://www.mp4converter.net/dvd-ripper-mac.html\"]","aside","#secondary","#ad-box-right,\nA[href*=\"http://serve.williamhillcasino.com/\"]","#after-popular,\n#inside-banner-1,\n#inside-banner-2,\n#inside-banner-3,\n#top-banner,\n.banner-min-h-600,\n.inside-articles-banner","A#promoLink","a.adv-link,\na.notrack",".OverallBlockBg,\n.ban-box,\n.ban_pushdown,\n.hban,\n.show.catfish_ad,\n.takeover-ban,\ndiv[class*=\"ban_hor_\"]",".banner",".banner-centered,\n.mobile-reverse:has(div[id^=\"div-gpt-\"]),\n.tw-50[style^=\"overflow\"]","A[href*=\"http://bold.adman.gr/\"],\nA[href*=\"http://talos.adman.gr/\"],\nDIV[id*=\"nimbleBuyWidget\"]",".bannergroup",".ads,\n.dockads.left,\n.inlineads","A[href*=\"gamebookers\"],\nA[href*=\"williamhill\"],\nDIV[id=\"MaxFooter\"],\nDIV[id=\"leo14102010e\"],\nDIV[id=\"vavouralis\"],\nIFRAME[src*=\"VistaBet\"]","#block-views-ads-sidebar-block-block","#afdiv","#left-adv,\n#right-adv,\n.disaronnobox","EMBED#efirstPage","strong > a[href^=\"http://autotriti.adman.gr/click\"]","A.fjmdiucexipcopnrmtke",".prices__promoted-separator,\nDIV#shopping-normal,\ndiv[data-is-promoted=\"\"]","A[href*=\"linkwise\"],\nIFRAME.blockrandom","#main-content > .content-wrap:nth-of-type(1) > .content > .candiabanners-index","A[href*=\"http://www.capital.gr/click.asp\"],\nTABLE[style=\"border: 1px solid rgb(194, 210, 216); background-color: rgb(240, 248, 255); font-size: 12px; padding: 2px;\"]",".below-facets-ad,\n.carzilla-ad > li,\n[href*=\"funshop.gr\"],\nol > li:has(.carzilla-ad),\nol > li:has([href*=\"funshop.gr\"])",".infacets.maskshop,\n.inlist.maskshop","#adLinks","div[class=\"story-textlinks row\"]","DIV.banner-side,\nDIV[style=\"width: 285px; float: right; overflow: hidden;\"]","#adtxtlink,\n#editor_link[style*=\"background:transparent url(http://www.sport24.gr/incoming/article\"],\n#top_story_wrap > .grid_12 > div:nth-of-type(7) > a[href^=\"http://www.stoiximan.gr\"],\n.mythos,\nA.cokeLink,\nA.cokeLink2,\nA[href*=\"http://www.betclic.com/\"],\nA[href=\"http://goo.gl/3vrB4h\"],\nDIV#bfair,\nDIV.proan,\nDIV[style=\"border-bottom: 5px solid rgb(0, 102, 204); clear: both;\"],\nIMG[alt=\"in association with betoto\"],\ndiv[class=\"ad468\"],\ndiv[class=\"ad728\"],\ndiv[class=\"betotoTxtPrem\"],\ndiv[class=\"bfairTxtPrem txtLink\"],\ndiv[class=\"intTxtPrem txtLink\"],\ndiv[class=\"trailer\"],\ndiv[class=\"txtLink\"],\ndiv[id=\"ctl00_Div1\"],\ndiv[id=\"s2c\"]","#stoiximan-cont > a[href^=\"http://www.stoiximan.gr\"]",".leftClickable,\n.rightClickable","A[href*=\"http://www.plaisio.gr\"]","#top_story_wrap > .grid_12 > div:nth-of-type(8) > a[href^=\"https://www.stoiximan.gr\"]","[href*=\"adman.gr\"]","#first-big-banner,\n.module-shadow","A.sponsLink","#sma-banner-wide,\n#sponsors-mainmodule",".space3d,\n.td-a-rec,\n.td-pb-span4.tdc-column.vc_column_container.wpb_column.tdi_128.vc_column,\ndiv[id*=\"clever_\"],\niframe[src*=\"unblockia\"]","A[href*=\"http://www.bet-at-home.com/\"]",".side,\n.static",".cart-reminder","#advsliding352,\ndiv[class=\"agores\"]",".deal","DIV#advsliding258","#custom_html-11,\n#custom_html-14,\n#custom_html-17,\n#custom_html-24,\n#custom_html-25,\n#custom_html-30,\n#custom_html-4,\n#custom_html-6,\n.afterheader,\n.background-cover,\n.custom-html-widget,\n.e3lan-top","#header-sidebar,\n#sidebar,\n.wpb_single_image:not(#printCover)",".attachment-full.aligncenter,\n.eng_ads,\n.eng_recs_holder",".left_fixed,\n.right_fixed","[src*=\"/BANNERS/\"],\n[src*=\"/banners/\"],\ndiv.title.sp-module:nth-of-type(5)",".ads-after-article-body","#text-10,\n#text-16,\n.td_block_widget,\n.vc_widget_sidebar",".ad-970-250","DIV#b177,\nDIV#b178,\nDIV#b199,\nDIV#b25,\nDIV#b32,\nDIV#b39,\nDIV#b41,\nDIV#b42,\nIMG#BLOGGER_PHOTO_ID_5491192352761655986,\nTD.content.first","#article-ad-container1,\n#article-ad-container3,\n#article-inread-ad-container,\n.print-hide.post-inline-ad",".sls,\n.srs","DIV#promotext,\nDIV.banner300250,\nDIV.underphoto","#custom_html-2,\n.bos_searchbox_widget_class",".adv,\n.widget_text[class^=\"widget-\"],\n[href^=\"https://casadikouros.gr\"],\n[href^=\"https://istikbalkouros.gr\"],\n[href^=\"https://kriton-energy.com\"],\nimg[src$=\".gif\"]",".td_block_15,\n.td_flex_block,\n.td_mod_wrap,\n.tdi_88_ffb,\n.vc_raw_html",".ad___auto.ad",".banner.medrect,\n.banner.minirect",".bdaia-ad-container,\n.bdaia-bellow-header,\n.bdaia-custom-area > .bd-container > div,\n.bdaia-widget-e3",".superbanner",".header-billboard","div[align=\"left\"]","div[class=\"lad\"],\ndiv[class^=\"ad\"]","#block-block-11,\n#block-block-247,\n#block-wblocks-wblocks_companies,\n#block-wblocks-wblocks_promoted_companies,\n#content-banner-korios,\n.game-center-matches-item-sponsor,\n.linkLeftCntr,\n.linkRightCntr,\nA.betAtHome,\nA[href*=\"http://ads.meridianbet.gr/\"],\nA[href*=\"http://adserving.unibet.com/\"],\nA[href*=\"http://ff.connextra.com/\"],\nA[href*=\"http://media.mybet.com/\"],\nA[href*=\"http://sportingbet.gr/\"],\nA[href*=\"http://www.novibet.com/Handlers/\"],\nA[href*=\"http://www.sportingbet.gr/paradise-poker/\"],\nA[href*=\"https://www.playbet.com/portal/\"],\nA[href^=\"http://www.bet365.gr/\"],\nDIV[id^=\"block-wadman\"]","#block-views-promoted_companies-block_1","A[href*=\"http://partner.sbaffiliates.com/\"]","#textlinks",".bottom-popout.is-open","DIV[id=\"_atssh\"],\niframe[src=\"*\"]","#rightcolumn > div:nth-of-type(1),\nfooter > div:nth-of-type(1) > div:nth-of-type(2)","A[href*=\"stanjames\"]","#full-width-ad,\n#full-width-ad-inner,\n#taboola-alternating-below-article-3","DIV.bannerhptop",".banner--full,\n.elementor-inner-column.elementor-col-33.elementor-column.elementor-element-79c1.elementor-element.has_ae_slider > .elementor-element-populated.elementor-column-wrap,\n.elementor-inner-column.elementor-col-33.elementor-column.elementor-element-7f24.elementor-element.has_ae_slider > .elementor-element-populated.elementor-column-wrap,\n.elementor-top-column.elementor-col-50.elementor-column.elementor-element-fc62ef0.elementor-element.has_ae_slider > .elementor-element-populated.elementor-column-wrap,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.adrotateSmall.elementor-element-1183.elementor-element,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.elementor-element-5032.elementor-element,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.elementor-element-99aff7b.elementor-element,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.elementor-element-aabbe09.elementor-element,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.elementor-element-f45669a.elementor-element > .elementor-widget-container,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.elementor-element-f8eec79.elementor-element,\n.elementor-widget-wp-widget-adrotate_widgets.elementor-widget.opapad.elementor-element-48f3775.elementor-element > .elementor-widget-container,\n.post-horizad","#HeaderBanner,\n#HomePageRightBanner3,\n#LeftBanner1,\n#LeftBanner2,\n#LeftBanner3,\n#MiddleBanner1,\n#RightBanner1,\n#RightBanner2,\n#RightBanner4,\n#RightBanner5,\n#RightBanner6,\n#RightBanner8,\n#in-home-rel-banners,\n#middle_banner_1,\n#middle_banner_2,\n.stamps,\nDIV#CenterRectangleBanner.adverticement,\nDIV#RightVerticalBanner.adverticement,\nDIV.admessage,\nDIV[style=\"width: 150px; height: 100px; margin-top: 5px; margin-bottom: 5px;\"],\ndiv[class=\"textlink\"]","DIV[style=\"background: url(\\\"Themes/1/Default/Media/image-ads-sponsor.jpg\\\") no-repeat scroll left center rgb(243, 243, 243); text-align: center; border-bottom: 1px solid rgb(230, 230, 230); padding: 4px 0px;\"],\nDIV[style=\"background:url(Themes/1/Default/Media/image-ads-sponsor.jpg) no-repeat left;  text-align:center;background-color: #F3F3F3;border-bottom:1px solid #E6E6E6;padding:4px 0px;\"]","#RightBanner3,\n#RightBanner7,\n#middlebanner3","#block-dfptaghome-horizontal-2,\n#block-dfptaghome-vertical-1,\n#block-dfptaghome-vertical-2,\n#block-dfptaghome-vertical-3,\n#block-dfptagside-bar-1-article,\n#block-dfptagside-bar-2-article,\ndiv.banner-place-in",".banner-728x90-top,\n.featured-2,\n.insMainAd.ad.grid--entry","#ipbwrapper > .bgad[href=\"http://www.kotsovolos.gr/site/mobile-phones-gps/mobile-phones/smartphones?v=0&company=Apple&11202=44834&utm_source=insomnia.gr&utm_medium=skin&utm_content=NEWiphone6s-6splus-insomnia-skin-2015&utm_campaign=iphone6s-6splus-insomnia-\"]","div[class=\"wp125ad odd\"]",".left,\n.right",".asdbg.wrap-right.inarticle-add-mob.inarticle-add",".boxzilla,\n.boxzilla-overlay,\n.itech-adlabel","#mvp-leader-wrap","#nx-stick-help,\n.ad-block-universal,\n.nxAds,\n.nxsidebar","#text-12",".stream-item-top.stream-item,\n.theiaStickySidebar > .widget_custom_html.widget.container-wrapper.widget_text,\n.theiaStickySidebar > .widget_media_image.widget.container-wrapper,\n[href=\"http://poulos-shop.gr\"],\n[href=\"http://www.toolpoint.gr\"]","div[class=\"RightColumnBanners\"],\ndiv[class=\"bannerTables\"]","#topfeatured,\n.alignleft.size-full.wp-image-16703,\n.box_banner,\n.top_ad_big,\n.wpbrbannerinside","#carousel-1","#banner-top-container,\n#left-dress2,\n.banner-side-collection,\n.categories2:nth-of-type(3)","#underUnderRotator,\n#widgetAD > div,\n.above-row,\n.fixedbottom,\n.head728,\n.home-aggelies,\n.module:nth-of-type(3),\n.underRotatorAd590,\n.underRotatorModuleAd590,\ndiv[id^=\"div-gpt-ad\"]",".custom_area_single_01,\n.elementor-element-3db4f540,\n.elementor-element-5680254d,\n.elementor-element-5716b5fa,\n.elementor-element-c2a8f89,\n.elementor-section-items-middle,\n.elementor-widget-image,\n.jeg_ad,\n.widget_sp_image,\n[class^=\"custom_position_single\"]","#das_out,\n.textads-wrapper,\na[href*=\"/lines/click/\"]","#itrofi-left,\n#itrofi-right,\n.bannerContent","DIV.textLink",".a-42.a-single,\n.a-46.a-single > [href=\"https://www.badrabbit.gr/\"],\n.td_single_image_bg,\n.widget_custom_html.custom_html-2,\n.widget_media_image","#box_text_ads","#text-88 > .textwidget",".cityAdv,\n.newsbeast","#leftboxhome,\n#rightboxhome,\n.leftbox,\n.rightbox,\na[href=\"http://www.myphone.gr/forum/\"] > img","#google_ads_container","DIV.banner",".naxos-pano-apo-tin-epikefalida-se-ola,\n.td-fix-index.tdb-block-inner > .naxos-target.naxos-meta-to-periechomeno",".ctHomesidebar,\n.ctMainPostAds","div.games","#editor_link,\n#link-deliveras,\n#mainContent > .alpha.grid_12 > .bolder.lineborder,\n#mainContent > .alpha.grid_12 > .main.default.stories:nth-of-type(4),\n#mainContent > .alpha.grid_12 > .main.default.stories:nth-of-type(5),\n#mainContent > .alpha.grid_12 > .main.default.stories:nth-of-type(6),\n#mainContent > .alpha.grid_12 > .main.default.stories:nth-of-type(8),\n.adSlot-height--premium.code-widget,\n.minHeight--400,\n.seatimage,\nDIV[class=\"dheadRightBoxBot\"],\ndiv[class=\"banner\"]","[href*=\"bit.ly\"]","#adFixFooter,\n#artFoot,\n#imgAd,\n.amSlotInReadVideo.jsx-3307064496,\n.doNotPrint.amSlotFeed.jsx-2939975430,\n.icon-popular.nespressoAdd,\n.menuAdd,\n.topShare_textad,\n.txtLinks,\n.undeMenuAmSlot2.skinContained.doNotPrint.amSlot.jsx-426522538,\nA[href*=\"http://bs.serving-sys.com/\"],\ndiv.sidebarAmSlot.jsx-1829390467","#json-textlinks,\n.skin-link,\nDIV[style=\"mergin:5px 0\"]","#left,\n#right,\n#sponsor-link,\nDIV[style=\"margin: 10px 0 0 0; display: block;clear:both;\"]",".sidebar,\naside.pospromo","#ctl00_articleLeftColumn_ctl04_adRotatorUpdatePanel,\n#ctl00_articleLeftColumn_ctl05_adRotatorUpdatePanel,\n#ctl00_articleLeftColumn_ctl06_adRotatorUpdatePanel,\n#ctl00_topBannersRight_ctl00_adRotatorUpdatePanel,\n.top_banners_outer",".topClickable","div[class=\"story-textlinks\"]","DIV[style=\"border: 1px solid rgb(224, 224, 224); padding: 2px; margin-left: 20px; background-color: rgb(244, 244, 252); width: 140px; font-size: 12px;\"]","#banners,\n.banners_mid_2","div.banner","#googleNewsBanner,\n#header > .span8,\n#sp-content-top-left > .visible-desktop.module,\n#sp-content-top-right > div.module > .clearfix.mod-wrapper > .clearfix.mod-content > .clearfix.mod-inner > .custom,\n#sp-right > div.module > .clearfix.mod-wrapper > .clearfix.mod-content > .clearfix.mod-inner > .custom,\n.clever_41786_pushdown,\n.yeslidergroup,\ndiv#sas_placement1119:nth-of-type(5),\ndiv.module:nth-of-type(9),\ndiv[id^=\"hstp-\"]","div[id^=\"epom-\"]","div[id=\"ad-links\"]","#box-sponsors","#block-block-40,\n#block-block-41,\n#left-ad-container,\n#region-sidebar-second,\n#right-ad-container,\n.block-header-728x90","#text-64,\n#text-65,\ndiv.single-subscribe-block",".big-banner-top,\n.main-margin.container > .newstrack-content.row > .post-margin-right.col-xs-8.col-md-8 > .waypoints.post-content > .affiliate > .textwidget",".banneritem","div.wrap-prodeals-widget","#provoc_sidebar_1,\n#provoc_sidebar_2,\n#provoc_sidebar_3,\n.billboardCnt,\n.billboardStickyWrap.container,\ndiv.inArticleLG",".wide-banner","#realTopBanner,\n#realTopBannerGap,\n.banner-wrapper","#right_col,\n.gk_tab_container0-style1,\n.gk_tab_wrap-style1","body > table:nth-of-type(2)","DIV.banners","IMG[src=\"images/betathome.jpg\"]","#sp-banners-carousel,\n#sp-banners-top,\n#sp-left,\n#sp-right,\n.sp-page-title,\n.sppb-section-content-center",".skin.news[href=\"https://www.facebook.com/NAIstinEllada\\A \"],\nDIV#jw_wwg,\nDIV#kw_logo,\nDIV[id=\"sony-internet-tv-holder\"],\nSPAN#jwlogo","#banner_160_filters,\n#banner_160_home,\n#banner_728_home,\n#new_contract_online_overlay,\n#sponsorship,\n.labeled-item.with-skus-slider.card.cf,\n.product-ad,\n.s_call_to_action,\n.selected-product-cards,\nDIV[id=\"afc\"],\nDIV[id=\"home_728x90\"],\nli.labeled-product.labeled-item.card.cf","#featurette","DIV.text-link-container.marg-top-10,\nDIV[style=\"float: left; width: 70px; padding-top: 7px;\"]","#backgroundlink,\n.textlinks,\nA.banner,\nA.footballbet,\nA.ga_track,\nA[href*=\"/specials/williamhill?\"],\nA[href*=\"http://www.e-germanos.gr\"],\nA[href=\"#0.1_\"],\nDIV[id=\"seios-link\"],\nLI.blue.casino,\nLI.blue.poker,\nSPAN.icon.icon-latest-news-ad",".bet-logos","#editor_link[style*=\"background:transparent url(http://www.contra.gr/Columns/article\"],\n#page > .content-top-wrap,\n.article-single__body > .content-thirdParty,\n.article-single__body > .creative_placeholder.content-thirdParty,\n.premium_banner,\nA[class=\"ad\"],\nA[href*=\"acidbet.gr\"],\nA[href*=\"betclic.com\"],\nA[href*=\"doubleclick.net\"],\nA[href*=\"e-shop.gr\"],\nA[href*=\"http://www.menperfect.gr\"],\nA[href*=\"http://www.sport24.gr/html/ent/042/ent.374042.asp\"],\nA[href*=\"http://www.sport24.gr/html/ent/765/ent.371765.asp\"],\nA[href*=\"mens-x.gr\"],\nA[href*=\"www.bwin.com\"],\nDIV.code.currentArea-logo,\n[id^=\"ros\"],\ndiv.ad,\ndiv[id^=\"ENGAGEYA\"]","#box-block-block-12",".textlink","#main > .ads,\n.aside","#fasa,\n#text-39,\n.mobile_adv",".ad__desktop.ad__div,\n.ad__div,\ndiv.sticky-el.ad__desktop.ad__div",".custom-html-widget2,\ncenter",".code-block-6,\n.header-promo,\n.thene-prin-to-arthro,\n.thene-widget","#kalogritsas300","#g-content-top-a,\n.customhidden-mobile,\n.moduletable.sideAdvertFix,\n.moduletable.sideFix,\n.sponsor","#sidebar > .widget_block.widget,\n#under-post-content,\n.before-content.section,\n.content-inner > .footer-wide.section,\n.owl-stage-outer,\n.size-full.wp-image-110042.aligncenter,\n.size-full.wp-image-122324.aligncenter,\n.wp-image-120708.size-full.aligncenter,\n.wp-image-120723.size-full.aligncenter","#content > div.center:has(> div.content-wrapper > div.taboola-feed),\n#sma-top-box > .boxHead_TopBar,\n.advert,\n.blog-list > div.blog-post:has(> div.abs),\n.sidebar-wrapper > div.sticky-block:has(> div.advert),\n.sticky-block:has(> div.sticky > div.advert),\ndiv[style=\"height:286px;\"]","#MAINAD-box,\n.ADBox","#BannerCategArticle300Right1,\n#BannerCategArticle300Right2,\n#BannerCategArticle300Right3,\n#BannerCategArticle300Right4,\n#Categheaderbanner728,\n#Homeheaderbanner728","A[href*=\"http://www.kazinoinfo.com/\"],\nDIV.box_main_ads","#wholesite1 > a[href^=\"http://jobby.gr\"],\n.cls-sticky-wrapper,\nDIV[class=\"subBanner\"],\nDIV[id=\"sb-container\"]","#frame_id_1,\n#frame_id_2,\n.central_banner_area,\n.hyperad_iframe,\n.new60sbanners,\n[href=\"http://www.escore.gr/\"],\ndiv.adds_sec:nth-of-type(4),\ndiv.adds_sec:nth-of-type(5)",".HTML.widget:not(:last-child) > div:first-child","#ad_13_left_1",".row.sidebar-nav","#financial_widget > .financial_widget_top_line.financial_widget_line > .financial_widget_top_line_medium.financial_widget_line_medium > .peiraios_link[href=\"http://www.piraeusbankgroup.com/\"],\nEMBED#mymovie",".connxtvscroll",".text-center.local-guides__banner","#AdPremiumSticky","A[href*=\"ad-emea.doubleclick.net/click\"],\nIMG[src*=\"ad-emea.doubleclick.net/\"]","IMG[src=\"images/728_generic_betnow.gif\"]","a[href=\"http://www.kratisinow.gr\"],\niframe[src=\"http://kratisinow.digitup.eu/widget/widget-artists\"]","#page-body-header,\n#sidebar-one","#text-19","#block-kentroxenonglossonlogos,\n#headline","#skin-container"];

const hostnamesMap = new Map([["*",[0,1,2]],["adslgr.com",3],["aek365.com",4],["aek365.gr",[4,16,30]],["amnizia.com",5],["oddbanner.bet-at-home.com",6],["elektronikosanagnostis.blogspot.com",7],["veriotis.gr",[7,141,180]],["fimotro.blogspot.com",8],["tro-ma-ktiko.blogspot.com",9],["enimerosi.com",10],["filoitexnisfilosofias.com",11],["greekddl.com",12],["greeksubtitlesproject.com",13],["inpaok.com",14],["megatv.com",15],["milaraki.com",[16,17]],["techteam.gr",16],["philenews.com",18],["dialogos.com.cy",[18,23]],["newmoney.gr",[18,127]],["start2click.com",19],["newsauto.gr",19],["subs4free.com",20],["unboxholics.com",21],["williamhill.com",22],["kathimerini.com.cy",24],["politis.com.cy",[25,26]],["koutipandoras.gr",[25,110]],["live24.gr",[25,116]],["popaganda.gr",[25,146]],["skai.gr",[25,157]],["gr",27],["2810.gr",28],["aegeanews24.gr",29],["alterthess.gr",31],["antenna.gr",32],["athinorama.gr",33],["auto24.gr",34],["autotriti.gr",35],["avgi.gr",36],["bestprice.gr",37],["bno.gr",38],["www.candiadoc.gr",39],["capital.gr",40],["car.gr",41],["www.car.gr",42],["clickatlife.gr",43],["cnn.gr",44],["sfl.com.gr",45],["contra.gr",[46,47,48,49]],["www.sport24.gr",[47,51]],["cosmo.gr",[48,53]],["www.techgear.gr",[48,168]],["sport-fm.gr",[49,124,161]],["sport24.gr",[49,163]],["www.contra.gr",[50,51]],["www.news247.gr",[51,129]],["corfuland.gr",52],["cretalive.gr",54],["cyclades24.gr",55],["derby.gr",56],["gazzetta.gr",[56,84,85,86]],["dokari.gr",57],["www.e-food.gr",58],["e-go.gr",[59,60]],["ethnos.gr",[60,72,73]],["imerisia.gr",[60,72,93]],["new.e-go.gr",61],["e-ptolemeos.gr",62],["e-thessalia.gr",63],["efsyn.gr",64],["www.eklogika.gr",65],["eleftheria.gr",66],["eleftherostypos.gr",67],["emvolos.gr",68],["energypress.gr",69],["enet.gr",70],["enikos.gr",71],["eviaportal.gr",74],["evros-news.gr",75],["filadelfia-xalkidona.gr",76],["www.flash.gr",77],["flix.gr",78],["fonien.gr",79],["forthnet.gr",80],["galinos.gr",81],["gasprice.gr",82],["gato.gr",83],["sportdog.gr",85],["in.gr",[86,95]],["gossip-tv.gr",[87,88]],["newsbomb.gr",[87,131]],["onsports.gr",[87,88]],["hiphop.gr",89],["i-kyr.gr",90],["i-live.gr",91],["iefimerida.gr",92],["imerodromos.gr",94],["news.in.gr",96],["sports.in.gr",97],["insider.gr",98],["insomnia.gr",99],["www.insomnia.gr",100],["interesting.gr",101],["inthevip.gr",102],["ipaidia.gr",103],["itechnews.gr",104],["kalamatatimes.gr",105],["kathimerini.gr",106],["katohika.gr",107],["kavalapoint.gr",108],["kerdos.gr",109],["kozanilife.gr",111],["www.kritikes-aggelies.gr",112],["lamiareport.gr",113],["larissanet.gr",114],["www.lifo.gr",115],["livescores.gr",117],["logotypos.gr",118],["madata.gr",119],["makeleio.gr",120],["meteo.gr",121],["myphone.gr",122],["naftemporiki.gr",[123,124]],["naxospress.gr",125],["naxostimes.gr",126],["news247.gr",128],["newsbeast.gr",130],["newsit.gr",132],["nickelodeon.gr",133],["nooz.gr",134],["oneman.gr",135],["onmed.gr",136],["opensoft.gr",137],["oroskopos.gr",138],["parapolitika.gr",139],["parianostypos.gr",[140,141]],["pathfinder.gr",142],["shopping.pathfinder.gr",143],["patrainews.gr",144],["pcsteps.gr",145],["prismanews.gr",147],["pronews.gr",148],["provocateur.gr",149],["queen.gr",150],["real.gr",151],["realestatenews.gr",152],["runningnews.gr",153],["www.trinews.gr",153],["sday.gr",154],["sentragoal.gr",155],["serraikanea.gr",156],["skroutz.gr",158],["www.skroutz.gr",159],["sport.gr",160],["www.sport-fm.gr",162],["supersyntages.gr",164],["tanea.gr",165],["tovima.gr",[165,176]],["www.taxheaven.gr",166],["techgear.gr",167],["tharrosnews.gr",169],["thenewspaper.gr",170],["thepressproject.gr",171],["thestival.gr",172],["tirnavospress.gr",173],["tlife.gr",174],["toarkoudi.gr",175],["tvsubtitles.gr",177],["tvxs.gr",178],["usay.gr",179],["vimaonline.gr",181],["voicenews.gr",182],["voria.gr",183],["womenonly.gr",184],["xo.gr",185],["www.xo.gr",186],["zoomnews.gr",187],["gamato.info",188],["www.dwrean.net",189],["fileleutheros.net",190],["pitsirikos.net",191],["anagnostis.org",192],["luben.tv",193]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map([["aggeliestanea.gr",[0]],["athensmagazine.gr",[1]],["www.ediva.gr",[2]]]);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
