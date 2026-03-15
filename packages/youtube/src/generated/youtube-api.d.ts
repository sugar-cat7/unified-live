// Auto-generated from YouTube Data API v3 Discovery Document.
// Do not edit manually. Run: npx tsx scripts/generate-youtube-types.ts

export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Rights management policy for YouTube resources. */
        AccessPolicy: {
            /** @description The value of allowed indicates whether the access to the policy is allowed or denied by default. */
            allowed?: boolean;
            /** @description A list of region codes that identify countries where the default policy do not apply. */
            exception?: string[];
        };
        /** @description A *channel* resource contains information about a YouTube channel. */
        Channel: {
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#channel". */
            kind?: string;
            /** @description The ID that YouTube uses to uniquely identify the channel. */
            id?: string;
            statistics?: components["schemas"]["ChannelStatistics"];
            contentOwnerDetails?: components["schemas"]["ChannelContentOwnerDetails"];
            /** @description Etag of this resource. */
            etag?: string;
            snippet?: components["schemas"]["ChannelSnippet"];
            topicDetails?: components["schemas"]["ChannelTopicDetails"];
            brandingSettings?: components["schemas"]["ChannelBrandingSettings"];
            /** @description Localizations for different languages */
            localizations?: {
                [key: string]: components["schemas"]["ChannelLocalization"];
            };
            auditDetails?: components["schemas"]["ChannelAuditDetails"];
            conversionPings?: components["schemas"]["ChannelConversionPings"];
            contentDetails?: components["schemas"]["ChannelContentDetails"];
            status?: components["schemas"]["ChannelStatus"];
        };
        /** @description The auditDetails object encapsulates channel data that is relevant for YouTube Partners during the audit process. */
        ChannelAuditDetails: {
            /** @description Whether or not the channel has any copyright strikes. */
            copyrightStrikesGoodStanding?: boolean;
            /** @description Whether or not the channel has any unresolved claims. */
            contentIdClaimsGoodStanding?: boolean;
            /** @description Whether or not the channel respects the community guidelines. */
            communityGuidelinesGoodStanding?: boolean;
        };
        /** @description Branding properties of a YouTube channel. */
        ChannelBrandingSettings: {
            channel?: components["schemas"]["ChannelSettings"];
            watch?: components["schemas"]["WatchSettings"];
            image?: components["schemas"]["ImageSettings"];
            /**
             * @deprecated
             * @description Additional experimental branding properties.
             */
            hints?: components["schemas"]["PropertyValue"][];
        };
        /** @description Details about the content of a channel. */
        ChannelContentDetails: {
            relatedPlaylists?: {
                /** @description The ID of the playlist that contains the channel"s uploaded videos. Use the videos.insert method to upload new videos and the videos.delete method to delete previously uploaded videos. */
                uploads?: string;
                /**
                 * @deprecated
                 * @description The ID of the playlist that contains the channel"s favorite videos. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.
                 */
                favorites?: string;
                /**
                 * @deprecated
                 * @description The ID of the playlist that contains the channel"s watch history. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.
                 */
                watchHistory?: string;
                /**
                 * @deprecated
                 * @description The ID of the playlist that contains the channel"s watch later playlist. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.
                 */
                watchLater?: string;
                /** @description The ID of the playlist that contains the channel"s liked videos. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list. */
                likes?: string;
            };
        };
        /** @description The contentOwnerDetails object encapsulates channel data that is relevant for YouTube Partners linked with the channel. */
        ChannelContentOwnerDetails: {
            /** @description The ID of the content owner linked to the channel. */
            contentOwner?: string;
            /**
             * Format: date-time
             * @description The date and time when the channel was linked to the content owner.
             */
            timeLinked?: string;
        };
        /** @description Pings that the app shall fire (authenticated by biscotti cookie). Each ping has a context, in which the app must fire the ping, and a url identifying the ping. */
        ChannelConversionPing: {
            /**
             * @description Defines the context of the ping.
             * @enum {string}
             */
            context?: "subscribe" | "unsubscribe" | "cview";
            /** @description The url (without the schema) that the player shall send the ping to. It's at caller's descretion to decide which schema to use (http vs https) Example of a returned url: //googleads.g.doubleclick.net/pagead/ viewthroughconversion/962985656/?data=path%3DtHe_path%3Btype%3D cview%3Butuid%3DGISQtTNGYqaYl4sKxoVvKA&labe=default The caller must append biscotti authentication (ms param in case of mobile, for example) to this ping. */
            conversionUrl?: string;
        };
        /** @description The conversionPings object encapsulates information about conversion pings that need to be respected by the channel. */
        ChannelConversionPings: {
            /** @description Pings that the app shall fire (authenticated by biscotti cookie). Each ping has a context, in which the app must fire the ping, and a url identifying the ping. */
            pings?: components["schemas"]["ChannelConversionPing"][];
        };
        ChannelListResponse: {
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#channelListResponse". */
            kind?: string;
            items?: components["schemas"]["Channel"][];
            /**
             * @deprecated
             * @description Serialized EventId of the request which produced this response.
             */
            eventId?: string;
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set. */
            nextPageToken?: string;
            /**
             * @deprecated
             * @description The visitorId identifies the visitor.
             */
            visitorId?: string;
            /** @description Etag of this resource. */
            etag?: string;
            tokenPagination?: components["schemas"]["TokenPagination"];
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set. */
            prevPageToken?: string;
            pageInfo?: components["schemas"]["PageInfo"];
        };
        /** @description Channel localization setting */
        ChannelLocalization: {
            /** @description The localized strings for channel's title. */
            title?: string;
            /** @description The localized strings for channel's description. */
            description?: string;
        };
        /** @description Branding properties for the channel view. */
        ChannelSettings: {
            /** @description The trailer of the channel, for users that are not subscribers. */
            unsubscribedTrailer?: string;
            /**
             * @deprecated
             * @description The list of featured channels.
             */
            featuredChannelsUrls?: string[];
            /**
             * @deprecated
             * @description Whether user-submitted comments left on the channel page need to be approved by the channel owner to be publicly visible.
             */
            moderateComments?: boolean;
            /**
             * @deprecated
             * @description Which content tab users should see when viewing the channel.
             */
            defaultTab?: string;
            /** @description Specifies the channel title. */
            title?: string;
            /** @description Lists keywords associated with the channel, comma-separated. */
            keywords?: string;
            /**
             * @deprecated
             * @description Whether the tab to browse the videos should be displayed.
             */
            showBrowseView?: boolean;
            /**
             * @deprecated
             * @description Title for the featured channels tab.
             */
            featuredChannelsTitle?: string;
            /**
             * @deprecated
             * @description A prominent color that can be rendered on this channel page.
             */
            profileColor?: string;
            defaultLanguage?: string;
            /** @description Specifies the channel description. */
            description?: string;
            /**
             * @deprecated
             * @description Whether related channels should be proposed.
             */
            showRelatedChannels?: boolean;
            /** @description The country of the channel. */
            country?: string;
            /** @description The ID for a Google Analytics account to track and measure traffic to the channels. */
            trackingAnalyticsAccountId?: string;
        };
        /** @description Basic details about a channel, including title, description and thumbnails. */
        ChannelSnippet: {
            /** @description The language of the channel's default title and description. */
            defaultLanguage?: string;
            /** @description The country of the channel. */
            country?: string;
            /**
             * Format: date-time
             * @description The date and time that the channel was created.
             */
            publishedAt?: string;
            /** @description The description of the channel. */
            description?: string;
            thumbnails?: components["schemas"]["ThumbnailDetails"];
            localized?: components["schemas"]["ChannelLocalization"];
            /** @description The channel's title. */
            title?: string;
            /** @description The custom url of the channel. */
            customUrl?: string;
        };
        /** @description Statistics about a channel: number of subscribers, number of videos in the channel, etc. */
        ChannelStatistics: {
            /** @description The number of videos uploaded to the channel. */
            videoCount?: string;
            /** @description The number of comments for the channel. */
            commentCount?: string;
            /** @description The number of subscribers that the channel has. */
            subscriberCount?: string;
            /** @description The number of times the channel has been viewed. */
            viewCount?: string;
            /** @description Whether or not the number of subscribers is shown for this user. */
            hiddenSubscriberCount?: boolean;
        };
        /** @description JSON template for the status part of a channel. */
        ChannelStatus: {
            madeForKids?: boolean;
            /** @description Whether the channel is considered ypp monetization enabled. See go/yppornot for more details. */
            isChannelMonetizationEnabled?: boolean;
            /**
             * @description Privacy status of the channel.
             * @enum {string}
             */
            privacyStatus?: "public" | "unlisted" | "private";
            /** @description If true, then the user is linked to either a YouTube username or G+ account. Otherwise, the user doesn't have a public YouTube identity. */
            isLinked?: boolean;
            /**
             * @description The long uploads status of this channel. See https://support.google.com/youtube/answer/71673 for more information.
             * @enum {string}
             */
            longUploadsStatus?: "longUploadsUnspecified" | "allowed" | "eligible" | "disallowed";
            selfDeclaredMadeForKids?: boolean;
        };
        /** @description Freebase topic information related to the channel. */
        ChannelTopicDetails: {
            /** @description A list of Wikipedia URLs that describe the channel's content. */
            topicCategories?: string[];
            /**
             * @deprecated
             * @description A list of Freebase topic IDs associated with the channel. You can retrieve information about each topic using the Freebase Topic API.
             */
            topicIds?: string[];
        };
        /** @description Ratings schemes. The country-specific ratings are mostly for movies and shows. LINT.IfChange */
        ContentRating: {
            /**
             * @description The video's Motion Picture Association of America (MPAA) rating.
             * @enum {string}
             */
            mpaaRating?: "mpaaUnspecified" | "mpaaG" | "mpaaPg" | "mpaaPg13" | "mpaaR" | "mpaaNc17" | "mpaaX" | "mpaaUnrated";
            /**
             * @description The video's Office of Film and Literature Classification (OFLC - New Zealand) rating.
             * @enum {string}
             */
            oflcRating?: "oflcUnspecified" | "oflcG" | "oflcPg" | "oflcM" | "oflcR13" | "oflcR15" | "oflcR16" | "oflcR18" | "oflcUnrated" | "oflcRp13" | "oflcRp16" | "oflcRp18";
            /**
             * @description The National Media Council ratings system for United Arab Emirates.
             * @enum {string}
             */
            nmcRating?: "nmcUnspecified" | "nmcG" | "nmcPg" | "nmcPg13" | "nmcPg15" | "nmc15plus" | "nmc18plus" | "nmc18tc" | "nmcUnrated";
            /**
             * @description The video's rating in Peru.
             * @enum {string}
             */
            pefilmRating?: "pefilmUnspecified" | "pefilmPt" | "pefilmPg" | "pefilm14" | "pefilm18" | "pefilmUnrated";
            /**
             * @description The video's rating from Statens medieråd (Sweden's National Media Council).
             * @enum {string}
             */
            smsaRating?: "smsaUnspecified" | "smsaA" | "smsa7" | "smsa11" | "smsa15" | "smsaUnrated";
            /**
             * @description The video's rating from Malaysia's Film Censorship Board.
             * @enum {string}
             */
            fcbmRating?: "fcbmUnspecified" | "fcbmU" | "fcbmPg13" | "fcbmP13" | "fcbm18" | "fcbm18sx" | "fcbm18pa" | "fcbm18sg" | "fcbm18pl" | "fcbmUnrated";
            /**
             * @description The video's rating in Poland.
             * @enum {string}
             */
            nbcplRating?: "nbcplUnspecified" | "nbcplI" | "nbcplIi" | "nbcplIii" | "nbcplIv" | "nbcpl18plus" | "nbcplUnrated";
            /**
             * @description Rating system in Turkey - Evaluation and Classification Board of the Ministry of Culture and Tourism
             * @enum {string}
             */
            ecbmctRating?: "ecbmctUnspecified" | "ecbmctG" | "ecbmct7a" | "ecbmct7plus" | "ecbmct13a" | "ecbmct13plus" | "ecbmct15a" | "ecbmct15plus" | "ecbmct18plus" | "ecbmctUnrated";
            /**
             * @description The video's INCAA (Instituto Nacional de Cine y Artes Audiovisuales - Argentina) rating.
             * @enum {string}
             */
            incaaRating?: "incaaUnspecified" | "incaaAtp" | "incaaSam13" | "incaaSam16" | "incaaSam18" | "incaaC" | "incaaUnrated";
            /**
             * @description The video's NICAM/Kijkwijzer rating from the Nederlands Instituut voor de Classificatie van Audiovisuele Media (Netherlands).
             * @enum {string}
             */
            kijkwijzerRating?: "kijkwijzerUnspecified" | "kijkwijzerAl" | "kijkwijzer6" | "kijkwijzer9" | "kijkwijzer12" | "kijkwijzer16" | "kijkwijzer18" | "kijkwijzerUnrated";
            /**
             * @description The video's rating from France's Conseil supérieur de l’audiovisuel, which rates broadcast content.
             * @enum {string}
             */
            csaRating?: "csaUnspecified" | "csaT" | "csa10" | "csa12" | "csa16" | "csa18" | "csaInterdiction" | "csaUnrated";
            /**
             * @description The video's rating from the Commission de Contrôle des Films (Belgium).
             * @enum {string}
             */
            cicfRating?: "cicfUnspecified" | "cicfE" | "cicfKtEa" | "cicfKntEna" | "cicfUnrated";
            /**
             * @description The rating system for MENA countries, a clone of MPAA. It is needed to prevent titles go live w/o additional QC check, since some of them can be inappropriate for the countries at all. See b/33408548 for more details.
             * @enum {string}
             */
            menaMpaaRating?: "menaMpaaUnspecified" | "menaMpaaG" | "menaMpaaPg" | "menaMpaaPg13" | "menaMpaaR" | "menaMpaaUnrated";
            /**
             * @description The video's rating from Singapore's Media Development Authority (MDA) and, specifically, it's Board of Film Censors (BFC).
             * @enum {string}
             */
            mdaRating?: "mdaUnspecified" | "mdaG" | "mdaPg" | "mdaPg13" | "mdaNc16" | "mdaM18" | "mdaR21" | "mdaUnrated";
            /**
             * @description The video's General Directorate of Radio, Television and Cinematography (Mexico) rating.
             * @enum {string}
             */
            rtcRating?: "rtcUnspecified" | "rtcAa" | "rtcA" | "rtcB" | "rtcB15" | "rtcC" | "rtcD" | "rtcUnrated";
            /**
             * @description The video's Eirin (映倫) rating. Eirin is the Japanese rating system.
             * @enum {string}
             */
            eirinRating?: "eirinUnspecified" | "eirinG" | "eirinPg12" | "eirinR15plus" | "eirinR18plus" | "eirinUnrated";
            /**
             * @description The video's Anatel (Asociación Nacional de Televisión) rating for Chilean television.
             * @enum {string}
             */
            anatelRating?: "anatelUnspecified" | "anatelF" | "anatelI" | "anatelI7" | "anatelI10" | "anatelI12" | "anatelR" | "anatelA" | "anatelUnrated";
            /**
             * @description The video's rating from the Movie and Television Review and Classification Board (Philippines).
             * @enum {string}
             */
            mtrcbRating?: "mtrcbUnspecified" | "mtrcbG" | "mtrcbPg" | "mtrcbR13" | "mtrcbR16" | "mtrcbR18" | "mtrcbX" | "mtrcbUnrated";
            /**
             * @description The video's rating from Medietilsynet, the Norwegian Media Authority.
             * @enum {string}
             */
            medietilsynetRating?: "medietilsynetUnspecified" | "medietilsynetA" | "medietilsynet6" | "medietilsynet7" | "medietilsynet9" | "medietilsynet11" | "medietilsynet12" | "medietilsynet15" | "medietilsynet18" | "medietilsynetUnrated";
            /**
             * @description The video's rating from Romania's CONSILIUL NATIONAL AL AUDIOVIZUALULUI (CNA).
             * @enum {string}
             */
            cnaRating?: "cnaUnspecified" | "cnaAp" | "cna12" | "cna15" | "cna18" | "cna18plus" | "cnaUnrated";
            /**
             * @description A rating that YouTube uses to identify age-restricted content.
             * @enum {string}
             */
            ytRating?: "ytUnspecified" | "ytAgeRestricted";
            /**
             * @description The video's rating in Greece.
             * @enum {string}
             */
            grfilmRating?: "grfilmUnspecified" | "grfilmK" | "grfilmE" | "grfilmK12" | "grfilmK13" | "grfilmK15" | "grfilmK17" | "grfilmK18" | "grfilmUnrated";
            /**
             * @description The video's rating in Iceland.
             * @enum {string}
             */
            smaisRating?: "smaisUnspecified" | "smaisL" | "smais7" | "smais12" | "smais14" | "smais16" | "smais18" | "smaisUnrated";
            /**
             * @description The video's rating in Venezuela.
             * @enum {string}
             */
            resorteviolenciaRating?: "resorteviolenciaUnspecified" | "resorteviolenciaA" | "resorteviolenciaB" | "resorteviolenciaC" | "resorteviolenciaD" | "resorteviolenciaE" | "resorteviolenciaUnrated";
            /**
             * @description The video's rating in Switzerland.
             * @enum {string}
             */
            chfilmRating?: "chfilmUnspecified" | "chfilm0" | "chfilm6" | "chfilm12" | "chfilm16" | "chfilm18" | "chfilmUnrated";
            /**
             * @description The video's rating from Nigeria's National Film and Video Censors Board.
             * @enum {string}
             */
            nfvcbRating?: "nfvcbUnspecified" | "nfvcbG" | "nfvcbPg" | "nfvcb12" | "nfvcb12a" | "nfvcb15" | "nfvcb18" | "nfvcbRe" | "nfvcbUnrated";
            /**
             * @description The rating system for trailer, DVD, and Ad in the US. See http://movielabs.com/md/ratings/v2.3/html/US_MPAAT_Ratings.html.
             * @enum {string}
             */
            mpaatRating?: "mpaatUnspecified" | "mpaatGb" | "mpaatRb";
            /**
             * @description The video's rating from Italy's Autorità per le Garanzie nelle Comunicazioni (AGCOM).
             * @enum {string}
             */
            agcomRating?: "agcomUnspecified" | "agcomT" | "agcomVm14" | "agcomVm18" | "agcomUnrated";
            /**
             * @description The video's rating from South Africa's Film and Publication Board.
             * @enum {string}
             */
            fpbRating?: "fpbUnspecified" | "fpbA" | "fpbPg" | "fpb79Pg" | "fpb1012Pg" | "fpb13" | "fpb16" | "fpb18" | "fpbX18" | "fpbXx" | "fpbUnrated" | "fpb10";
            /**
             * @description The video's Consejo de Calificación Cinematográfica (Chile) rating.
             * @enum {string}
             */
            cccRating?: "cccUnspecified" | "cccTe" | "ccc6" | "ccc14" | "ccc18" | "ccc18v" | "ccc18s" | "cccUnrated";
            /**
             * @description The video's Instituto de la Cinematografía y de las Artes Audiovisuales (ICAA - Spain) rating.
             * @enum {string}
             */
            icaaRating?: "icaaUnspecified" | "icaaApta" | "icaa7" | "icaa12" | "icaa13" | "icaa16" | "icaa18" | "icaaX" | "icaaUnrated";
            /**
             * @description Rating system for Canadian TV - Canadian TV Classification System The video's rating from the Canadian Radio-Television and Telecommunications Commission (CRTC) for Canadian English-language broadcasts. For more information, see the Canadian Broadcast Standards Council website.
             * @enum {string}
             */
            catvRating?: "catvUnspecified" | "catvC" | "catvC8" | "catvG" | "catvPg" | "catv14plus" | "catv18plus" | "catvUnrated" | "catvE";
            /**
             * @description The video's rating from Taiwan's Ministry of Culture (文化部).
             * @enum {string}
             */
            moctwRating?: "moctwUnspecified" | "moctwG" | "moctwP" | "moctwPg" | "moctwR" | "moctwUnrated" | "moctwR12" | "moctwR15";
            /**
             * @description The video's rating from Thailand's Board of Film and Video Censors.
             * @enum {string}
             */
            bfvcRating?: "bfvcUnspecified" | "bfvcG" | "bfvcE" | "bfvc13" | "bfvc15" | "bfvc18" | "bfvc20" | "bfvcB" | "bfvcUnrated";
            /**
             * @description The video's rating in Slovakia.
             * @enum {string}
             */
            skfilmRating?: "skfilmUnspecified" | "skfilmG" | "skfilmP2" | "skfilmP5" | "skfilmP8" | "skfilmUnrated";
            /** @description Reasons that explain why the video received its DJCQT (Brazil) rating. */
            djctqRatingReasons?: ("djctqRatingReasonUnspecified" | "djctqViolence" | "djctqExtremeViolence" | "djctqSexualContent" | "djctqNudity" | "djctqSex" | "djctqExplicitSex" | "djctqDrugs" | "djctqLegalDrugs" | "djctqIllegalDrugs" | "djctqInappropriateLanguage" | "djctqCriminalActs" | "djctqImpactingContent" | "djctqFear" | "djctqMedicalProcedures" | "djctqSensitiveTopics" | "djctqFantasyViolence")[];
            /**
             * @description The video's rating from Finland's Kansallinen Audiovisuaalinen Instituutti (National Audiovisual Institute).
             * @enum {string}
             */
            mekuRating?: "mekuUnspecified" | "mekuS" | "meku7" | "meku12" | "meku16" | "meku18" | "mekuUnrated";
            /**
             * @description The video's rating in Egypt.
             * @enum {string}
             */
            egfilmRating?: "egfilmUnspecified" | "egfilmGn" | "egfilm18" | "egfilmBn" | "egfilmUnrated";
            /**
             * @description The video's rating from Luxembourg's Commission de surveillance de la classification des films (CSCF).
             * @enum {string}
             */
            cscfRating?: "cscfUnspecified" | "cscfAl" | "cscfA" | "cscf6" | "cscf9" | "cscf12" | "cscf16" | "cscf18" | "cscfUnrated";
            /**
             * @description The video's Australian Classification Board (ACB) or Australian Communications and Media Authority (ACMA) rating. ACMA ratings are used to classify children's television programming.
             * @enum {string}
             */
            acbRating?: "acbUnspecified" | "acbE" | "acbP" | "acbC" | "acbG" | "acbPg" | "acbM" | "acbMa15plus" | "acbR18plus" | "acbUnrated";
            /**
             * @description The video's rating from the Canadian Radio-Television and Telecommunications Commission (CRTC) for Canadian French-language broadcasts. For more information, see the Canadian Broadcast Standards Council website.
             * @enum {string}
             */
            catvfrRating?: "catvfrUnspecified" | "catvfrG" | "catvfr8plus" | "catvfr13plus" | "catvfr16plus" | "catvfr18plus" | "catvfrUnrated" | "catvfrE";
            /**
             * @description The video's rating from Hong Kong's Office for Film, Newspaper and Article Administration.
             * @enum {string}
             */
            fcoRating?: "fcoUnspecified" | "fcoI" | "fcoIia" | "fcoIib" | "fcoIi" | "fcoIii" | "fcoUnrated";
            /**
             * @description The video's British Board of Film Classification (BBFC) rating.
             * @enum {string}
             */
            bbfcRating?: "bbfcUnspecified" | "bbfcU" | "bbfcPg" | "bbfc12a" | "bbfc12" | "bbfc15" | "bbfc18" | "bbfcR18" | "bbfcUnrated";
            /**
             * @description The video's rating from the Hungarian Nemzeti Filmiroda, the Rating Committee of the National Office of Film.
             * @enum {string}
             */
            rcnofRating?: "rcnofUnspecified" | "rcnofI" | "rcnofIi" | "rcnofIii" | "rcnofIv" | "rcnofV" | "rcnofVi" | "rcnofUnrated";
            /**
             * @description The video's rating from Portugal's Comissão de Classificação de Espect´culos.
             * @enum {string}
             */
            cceRating?: "cceUnspecified" | "cceM4" | "cceM6" | "cceM12" | "cceM16" | "cceM18" | "cceUnrated" | "cceM14";
            /**
             * @description The video's TV Parental Guidelines (TVPG) rating.
             * @enum {string}
             */
            tvpgRating?: "tvpgUnspecified" | "tvpgY" | "tvpgY7" | "tvpgY7Fv" | "tvpgG" | "tvpgPg" | "pg14" | "tvpgMa" | "tvpgUnrated";
            /**
             * @description The video's Central Board of Film Certification (CBFC - India) rating.
             * @enum {string}
             */
            cbfcRating?: "cbfcUnspecified" | "cbfcU" | "cbfcUA" | "cbfcUA7plus" | "cbfcUA13plus" | "cbfcUA16plus" | "cbfcA" | "cbfcS" | "cbfcUnrated";
            /**
             * @description The video's Korea Media Rating Board (영상물등급위원회) rating. The KMRB rates videos in South Korea.
             * @enum {string}
             */
            kmrbRating?: "kmrbUnspecified" | "kmrbAll" | "kmrb12plus" | "kmrb15plus" | "kmrbTeenr" | "kmrbR" | "kmrbUnrated";
            /**
             * @description The video's rating from Ireland's Raidió Teilifís Éireann.
             * @enum {string}
             */
            rteRating?: "rteUnspecified" | "rteGa" | "rteCh" | "rtePs" | "rteMa" | "rteUnrated";
            /**
             * @description The video's rating from Indonesia's Lembaga Sensor Film.
             * @enum {string}
             */
            lsfRating?: "lsfUnspecified" | "lsfSu" | "lsfA" | "lsfBo" | "lsf13" | "lsfR" | "lsf17" | "lsfD" | "lsf21" | "lsfUnrated";
            /**
             * @description The video's rating from the Danish Film Institute's (Det Danske Filminstitut) Media Council for Children and Young People.
             * @enum {string}
             */
            mccypRating?: "mccypUnspecified" | "mccypA" | "mccyp7" | "mccyp11" | "mccyp15" | "mccypUnrated";
            /**
             * @description The video's rating from the Austrian Board of Media Classification (Bundesministerium für Unterricht, Kunst und Kultur).
             * @enum {string}
             */
            bmukkRating?: "bmukkUnspecified" | "bmukkAa" | "bmukk6" | "bmukk8" | "bmukk10" | "bmukk12" | "bmukk14" | "bmukk16" | "bmukkUnrated";
            /**
             * @description The video's rating in Israel.
             * @enum {string}
             */
            ilfilmRating?: "ilfilmUnspecified" | "ilfilmAa" | "ilfilm12" | "ilfilm14" | "ilfilm16" | "ilfilm18" | "ilfilmUnrated";
            /**
             * @description The video's Ministerio de Cultura (Colombia) rating.
             * @enum {string}
             */
            mocRating?: "mocUnspecified" | "mocE" | "mocT" | "moc7" | "moc12" | "moc15" | "moc18" | "mocX" | "mocBanned" | "mocUnrated";
            /**
             * @description The video's rating from the Bulgarian National Film Center.
             * @enum {string}
             */
            nfrcRating?: "nfrcUnspecified" | "nfrcA" | "nfrcB" | "nfrcC" | "nfrcD" | "nfrcX" | "nfrcUnrated";
            /**
             * @description The video's rating from the Ministero dei Beni e delle Attività Culturali e del Turismo (Italy).
             * @enum {string}
             */
            mibacRating?: "mibacUnspecified" | "mibacT" | "mibacVap" | "mibacVm6" | "mibacVm12" | "mibacVm14" | "mibacVm16" | "mibacVm18" | "mibacUnrated";
            /**
             * @description The video's rating from Malta's Film Age-Classification Board.
             * @enum {string}
             */
            mccaaRating?: "mccaaUnspecified" | "mccaaU" | "mccaaPg" | "mccaa12a" | "mccaa12" | "mccaa14" | "mccaa15" | "mccaa16" | "mccaa18" | "mccaaUnrated";
            /**
             * @description The video's rating from the Nacionãlais Kino centrs (National Film Centre of Latvia).
             * @enum {string}
             */
            nkclvRating?: "nkclvUnspecified" | "nkclvU" | "nkclv7plus" | "nkclv12plus" | "nkclv16plus" | "nkclv18plus" | "nkclvUnrated";
            /**
             * @description The video's rating in the Czech Republic.
             * @enum {string}
             */
            czfilmRating?: "czfilmUnspecified" | "czfilmU" | "czfilm12" | "czfilm14" | "czfilm18" | "czfilmUnrated";
            /**
             * @description The video's Canadian Home Video Rating System (CHVRS) rating.
             * @enum {string}
             */
            chvrsRating?: "chvrsUnspecified" | "chvrsG" | "chvrsPg" | "chvrs14a" | "chvrs18a" | "chvrsR" | "chvrsE" | "chvrsUnrated";
            /** @description Reasons that explain why the video received its FPB (South Africa) rating. */
            fpbRatingReasons?: ("fpbRatingReasonUnspecified" | "fpbBlasphemy" | "fpbLanguage" | "fpbNudity" | "fpbPrejudice" | "fpbSex" | "fpbViolence" | "fpbDrugs" | "fpbSexualViolence" | "fpbHorror" | "fpbCriminalTechniques" | "fpbImitativeActsTechniques")[];
            /**
             * @description The video's Irish Film Classification Office (IFCO - Ireland) rating. See the IFCO website for more information.
             * @enum {string}
             */
            ifcoRating?: "ifcoUnspecified" | "ifcoG" | "ifcoPg" | "ifco12" | "ifco12a" | "ifco15" | "ifco15a" | "ifco16" | "ifco18" | "ifcoUnrated";
            /**
             * @deprecated
             * @description This property has been deprecated. Use the contentDetails.contentRating.cncRating instead.
             * @enum {string}
             */
            fmocRating?: "fmocUnspecified" | "fmocU" | "fmoc10" | "fmoc12" | "fmoc16" | "fmoc18" | "fmocE" | "fmocUnrated";
            /**
             * @description The video's rating in Estonia.
             * @enum {string}
             */
            eefilmRating?: "eefilmUnspecified" | "eefilmPere" | "eefilmL" | "eefilmMs6" | "eefilmK6" | "eefilmMs12" | "eefilmK12" | "eefilmK14" | "eefilmK16" | "eefilmUnrated";
            /**
             * @description The video's Freiwillige Selbstkontrolle der Filmwirtschaft (FSK - Germany) rating.
             * @enum {string}
             */
            fskRating?: "fskUnspecified" | "fsk0" | "fsk6" | "fsk12" | "fsk16" | "fsk18" | "fskUnrated";
            /**
             * @description The video's rating from the Kenya Film Classification Board.
             * @enum {string}
             */
            kfcbRating?: "kfcbUnspecified" | "kfcbG" | "kfcbPg" | "kfcb16plus" | "kfcbR" | "kfcbUnrated";
            /**
             * @description The video's Departamento de Justiça, Classificação, Qualificação e Títulos (DJCQT - Brazil) rating.
             * @enum {string}
             */
            djctqRating?: "djctqUnspecified" | "djctqL" | "djctq10" | "djctq12" | "djctq14" | "djctq16" | "djctq18" | "djctqEr" | "djctqL10" | "djctqL12" | "djctqL14" | "djctqL16" | "djctqL18" | "djctq1012" | "djctq1014" | "djctq1016" | "djctq1018" | "djctq1214" | "djctq1216" | "djctq1218" | "djctq1416" | "djctq1418" | "djctq1618" | "djctqUnrated";
            /**
             * @description The video's National Film Registry of the Russian Federation (MKRF - Russia) rating.
             * @enum {string}
             */
            russiaRating?: "russiaUnspecified" | "russia0" | "russia6" | "russia12" | "russia16" | "russia18" | "russiaUnrated";
            /**
             * @description Rating system in France - Commission de classification cinematographique
             * @enum {string}
             */
            cncRating?: "cncUnspecified" | "cncT" | "cnc10" | "cnc12" | "cnc16" | "cnc18" | "cncE" | "cncInterdiction" | "cncUnrated";
            /**
             * @description The video's rating system for Vietnam - MCST
             * @enum {string}
             */
            mcstRating?: "mcstUnspecified" | "mcstP" | "mcst0" | "mcstC13" | "mcstC16" | "mcst16plus" | "mcstC18" | "mcstGPg" | "mcstUnrated";
            /**
             * @description The video's rating from the Maldives National Bureau of Classification.
             * @enum {string}
             */
            nbcRating?: "nbcUnspecified" | "nbcG" | "nbcPg" | "nbc12plus" | "nbc15plus" | "nbc18plus" | "nbc18plusr" | "nbcPu" | "nbcUnrated";
        };
        /** @description Geographical coordinates of a point, in WGS84. */
        GeoPoint: {
            /** @description Altitude above the reference ellipsoid, in meters. */
            altitude?: number;
            /** @description Latitude in degrees. */
            latitude?: number;
            /** @description Longitude in degrees. */
            longitude?: number;
        };
        /** @description Branding properties for images associated with the channel. */
        ImageSettings: {
            /**
             * @deprecated
             * @description The URL for a 1px by 1px tracking pixel that can be used to collect statistics for views of the channel or video pages.
             */
            trackingImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. TV size extra high resolution (2120x1192).
             */
            bannerTvImageUrl?: string;
            /** @deprecated */
            watchIconImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. TV size high resolution (1920x1080).
             */
            bannerTvHighImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. Tablet size low resolution (1138x188).
             */
            bannerTabletLowImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. TV size medium resolution (1280x720).
             */
            bannerTvMediumImageUrl?: string;
            largeBrandedBannerImageImapScript?: components["schemas"]["LocalizedProperty"];
            smallBrandedBannerImageImapScript?: components["schemas"]["LocalizedProperty"];
            /**
             * @deprecated
             * @description Banner image. Mobile size low resolution (320x88).
             */
            bannerMobileLowImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. Mobile size high resolution (1440x395).
             */
            bannerMobileExtraHdImageUrl?: string;
            /** @description This is generated when a ChannelBanner.Insert request has succeeded for the given channel. */
            bannerExternalUrl?: string;
            backgroundImageUrl?: components["schemas"]["LocalizedProperty"];
            /**
             * @deprecated
             * @description Banner image. Tablet size (1707x283).
             */
            bannerTabletImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. Mobile size high resolution (1280x360).
             */
            bannerMobileHdImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. TV size low resolution (854x480).
             */
            bannerTvLowImageUrl?: string;
            largeBrandedBannerImageUrl?: components["schemas"]["LocalizedProperty"];
            /**
             * @deprecated
             * @description Banner image. Mobile size (640x175).
             */
            bannerMobileImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. Tablet size extra high resolution (2560x424).
             */
            bannerTabletExtraHdImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. Tablet size high resolution (2276x377).
             */
            bannerTabletHdImageUrl?: string;
            smallBrandedBannerImageUrl?: components["schemas"]["LocalizedProperty"];
            /**
             * @deprecated
             * @description Banner image. Desktop size (1060x175).
             */
            bannerImageUrl?: string;
            /**
             * @deprecated
             * @description Banner image. Mobile size medium/high resolution (960x263).
             */
            bannerMobileMediumHdImageUrl?: string;
        };
        LanguageTag: {
            value?: string;
        };
        LocalizedProperty: {
            defaultLanguage?: components["schemas"]["LanguageTag"];
            default?: string;
            localized?: components["schemas"]["LocalizedString"][];
        };
        LocalizedString: {
            language?: string;
            value?: string;
        };
        /** @description Paging details for lists of resources, including total number of items available and number of resources returned in a single page. */
        PageInfo: {
            /** @description The total number of results in the result set. */
            totalResults?: number;
            /** @description The number of results included in the API response. */
            resultsPerPage?: number;
        };
        /** @description A *playlistItem* resource identifies another resource, such as a video, that is included in a playlist. In addition, the playlistItem resource contains details about the included resource that pertain specifically to how that resource is used in that playlist. YouTube uses playlists to identify special collections of videos for a channel, such as: - uploaded videos - favorite videos - positively rated (liked) videos - watch history - watch later To be more specific, these lists are associated with a channel, which is a collection of a person, group, or company's videos, playlists, and other YouTube information. You can retrieve the playlist IDs for each of these lists from the channel resource for a given channel. You can then use the playlistItems.list method to retrieve any of those lists. You can also add or remove items from those lists by calling the playlistItems.insert and playlistItems.delete methods. For example, if a user gives a positive rating to a video, you would insert that video into the liked videos playlist for that user's channel. */
        PlaylistItem: {
            snippet?: components["schemas"]["PlaylistItemSnippet"];
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#playlistItem". */
            kind?: string;
            /** @description Etag of this resource. */
            etag?: string;
            /** @description The ID that YouTube uses to uniquely identify the playlist item. */
            id?: string;
            contentDetails?: components["schemas"]["PlaylistItemContentDetails"];
            status?: components["schemas"]["PlaylistItemStatus"];
        };
        PlaylistItemContentDetails: {
            /**
             * Format: date-time
             * @description The date and time that the video was published to YouTube.
             */
            videoPublishedAt?: string;
            /**
             * @deprecated
             * @description The time, measured in seconds from the start of the video, when the video should stop playing. (The playlist owner can specify the times when the video should start and stop playing when the video is played in the context of the playlist.) By default, assume that the video.endTime is the end of the video.
             */
            endAt?: string;
            /** @description A user-generated note for this item. */
            note?: string;
            /**
             * @deprecated
             * @description The time, measured in seconds from the start of the video, when the video should start playing. (The playlist owner can specify the times when the video should start and stop playing when the video is played in the context of the playlist.) The default value is 0.
             */
            startAt?: string;
            /** @description The ID that YouTube uses to uniquely identify a video. To retrieve the video resource, set the id query parameter to this value in your API request. */
            videoId?: string;
        };
        PlaylistItemListResponse: {
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#playlistItemListResponse". */
            kind?: string;
            /** @description A list of playlist items that match the request criteria. */
            items?: components["schemas"]["PlaylistItem"][];
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set. */
            nextPageToken?: string;
            /** @description Serialized EventId of the request which produced this response. */
            eventId?: string;
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set. */
            prevPageToken?: string;
            etag?: string;
            tokenPagination?: components["schemas"]["TokenPagination"];
            /** @description The visitorId identifies the visitor. */
            visitorId?: string;
            pageInfo?: components["schemas"]["PageInfo"];
        };
        /** @description Basic details about a playlist, including title, description and thumbnails. Basic details of a YouTube Playlist item provided by the author. Next ID: 15 */
        PlaylistItemSnippet: {
            /** @description Channel id for the channel this video belongs to. */
            videoOwnerChannelId?: string;
            /**
             * Format: date-time
             * @description The date and time that the item was added to the playlist.
             */
            publishedAt?: string;
            /** @description Channel title for the channel this video belongs to. */
            videoOwnerChannelTitle?: string;
            /** @description Channel title for the channel that the playlist item belongs to. */
            channelTitle?: string;
            thumbnails?: components["schemas"]["ThumbnailDetails"];
            /** @description The order in which the item appears in the playlist. The value uses a zero-based index, so the first item has a position of 0, the second item has a position of 1, and so forth. */
            position?: number;
            /** @description The item's description. */
            description?: string;
            /** @description The ID that YouTube uses to uniquely identify thGe playlist that the playlist item is in. */
            playlistId?: string;
            /** @description The ID that YouTube uses to uniquely identify the user that added the item to the playlist. */
            channelId?: string;
            /** @description The item's title. */
            title?: string;
            resourceId?: components["schemas"]["ResourceId"];
        };
        /** @description Information about the playlist item's privacy status. */
        PlaylistItemStatus: {
            /**
             * @description This resource's privacy status.
             * @enum {string}
             */
            privacyStatus?: "public" | "unlisted" | "private";
        };
        /** @description A pair Property / Value. */
        PropertyValue: {
            /** @description A property. */
            property?: string;
            /** @description The property's value. */
            value?: string;
        };
        /** @description A resource id is a generic reference that points to another YouTube resource. */
        ResourceId: {
            /** @description The type of the API resource. */
            kind?: string;
            /** @description The ID that YouTube uses to uniquely identify the referred resource, if that resource is a playlist. This property is only present if the resourceId.kind value is youtube#playlist. */
            playlistId?: string;
            /** @description The ID that YouTube uses to uniquely identify the referred resource, if that resource is a channel. This property is only present if the resourceId.kind value is youtube#channel. */
            channelId?: string;
            /** @description The ID that YouTube uses to uniquely identify the referred resource, if that resource is a video. This property is only present if the resourceId.kind value is youtube#video. */
            videoId?: string;
        };
        SearchListResponse: {
            /** @description Serialized EventId of the request which produced this response. */
            eventId?: string;
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set. */
            nextPageToken?: string;
            regionCode?: string;
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#searchListResponse". */
            kind?: string;
            /** @description Pagination information for token pagination. */
            items?: components["schemas"]["SearchResult"][];
            pageInfo?: components["schemas"]["PageInfo"];
            /** @description The visitorId identifies the visitor. */
            visitorId?: string;
            /** @description Etag of this resource. */
            etag?: string;
            tokenPagination?: components["schemas"]["TokenPagination"];
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set. */
            prevPageToken?: string;
        };
        /** @description A search result contains information about a YouTube video, channel, or playlist that matches the search parameters specified in an API request. While a search result points to a uniquely identifiable resource, like a video, it does not have its own persistent data. */
        SearchResult: {
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#searchResult". */
            kind?: string;
            /** @description Etag of this resource. */
            etag?: string;
            id?: components["schemas"]["ResourceId"];
            snippet?: components["schemas"]["SearchResultSnippet"];
        };
        /** @description Basic details about a search result, including title, description and thumbnails of the item referenced by the search result. */
        SearchResultSnippet: {
            /** @description The title of the channel that published the resource that the search result identifies. */
            channelTitle?: string;
            thumbnails?: components["schemas"]["ThumbnailDetails"];
            /**
             * @description It indicates if the resource (video or channel) has upcoming/active live broadcast content. Or it's "none" if there is not any upcoming/active live broadcasts.
             * @enum {string}
             */
            liveBroadcastContent?: "none" | "upcoming" | "live" | "completed";
            /** @description The title of the search result. */
            title?: string;
            /** @description The value that YouTube uses to uniquely identify the channel that published the resource that the search result identifies. */
            channelId?: string;
            /** @description A description of the search result. */
            description?: string;
            /**
             * Format: date-time
             * @description The creation date and time of the resource that the search result identifies.
             */
            publishedAt?: string;
        };
        /** @description A thumbnail is an image representing a YouTube resource. */
        Thumbnail: {
            /** @description The thumbnail image's URL. */
            url?: string;
            /** @description (Optional) Height of the thumbnail image. */
            height?: number;
            /** @description (Optional) Width of the thumbnail image. */
            width?: number;
        };
        /** @description Internal representation of thumbnails for a YouTube resource. */
        ThumbnailDetails: {
            high?: components["schemas"]["Thumbnail"];
            default?: components["schemas"]["Thumbnail"];
            medium?: components["schemas"]["Thumbnail"];
            standard?: components["schemas"]["Thumbnail"];
            maxres?: components["schemas"]["Thumbnail"];
        };
        /** @description Stub token pagination template to suppress results. */
        TokenPagination: Record<string, never>;
        /** @description A *video* resource represents a YouTube video. */
        Video: {
            /** @description Etag of this resource. */
            etag?: string;
            recordingDetails?: components["schemas"]["VideoRecordingDetails"];
            player?: components["schemas"]["VideoPlayer"];
            liveStreamingDetails?: components["schemas"]["VideoLiveStreamingDetails"];
            projectDetails?: components["schemas"]["VideoProjectDetails"];
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#video". */
            kind?: string;
            ageGating?: components["schemas"]["VideoAgeGating"];
            statistics?: components["schemas"]["VideoStatistics"];
            suggestions?: components["schemas"]["VideoSuggestions"];
            /** @description The ID that YouTube uses to uniquely identify the video. */
            id?: string;
            fileDetails?: components["schemas"]["VideoFileDetails"];
            processingDetails?: components["schemas"]["VideoProcessingDetails"];
            status?: components["schemas"]["VideoStatus"];
            contentDetails?: components["schemas"]["VideoContentDetails"];
            monetizationDetails?: components["schemas"]["VideoMonetizationDetails"];
            /** @description The localizations object contains localized versions of the basic details about the video, such as its title and description. */
            localizations?: {
                [key: string]: components["schemas"]["VideoLocalization"];
            };
            topicDetails?: components["schemas"]["VideoTopicDetails"];
            paidProductPlacementDetails?: components["schemas"]["VideoPaidProductPlacementDetails"];
            snippet?: components["schemas"]["VideoSnippet"];
        };
        VideoAgeGating: {
            /**
             * @description Video game rating, if any.
             * @enum {string}
             */
            videoGameRating?: "anyone" | "m15Plus" | "m16Plus" | "m17Plus";
            /** @description Indicates whether or not the video has alcoholic beverage content. Only users of legal purchasing age in a particular country, as identified by ICAP, can view the content. */
            alcoholContent?: boolean;
            /** @description Age-restricted trailers. For redband trailers and adult-rated video-games. Only users aged 18+ can view the content. The the field is true the content is restricted to viewers aged 18+. Otherwise The field won't be present. */
            restricted?: boolean;
        };
        /** @description Details about the content of a YouTube Video. */
        VideoContentDetails: {
            /** @description The value of is_license_content indicates whether the video is licensed content. */
            licensedContent?: boolean;
            contentRating?: components["schemas"]["ContentRating"];
            /** @description The value of dimension indicates whether the video is available in 3D or in 2D. */
            dimension?: string;
            countryRestriction?: components["schemas"]["AccessPolicy"];
            /**
             * @description The value of definition indicates whether the video is available in high definition or only in standard definition.
             * @enum {string}
             */
            definition?: "sd" | "hd";
            /** @description The length of the video. The tag value is an ISO 8601 duration in the format PT#M#S, in which the letters PT indicate that the value specifies a period of time, and the letters M and S refer to length in minutes and seconds, respectively. The # characters preceding the M and S letters are both integers that specify the number of minutes (or seconds) of the video. For example, a value of PT15M51S indicates that the video is 15 minutes and 51 seconds long. */
            duration?: string;
            /**
             * @description The value of captions indicates whether the video has captions or not.
             * @enum {string}
             */
            caption?: "true" | "false";
            regionRestriction?: components["schemas"]["VideoContentDetailsRegionRestriction"];
            /**
             * @description Specifies the projection format of the video.
             * @enum {string}
             */
            projection?: "rectangular" | "360";
            /** @description Indicates whether the video uploader has provided a custom thumbnail image for the video. This property is only visible to the video uploader. */
            hasCustomThumbnail?: boolean;
        };
        /** @description DEPRECATED Region restriction of the video. */
        VideoContentDetailsRegionRestriction: {
            /** @description A list of region codes that identify countries where the video is viewable. If this property is present and a country is not listed in its value, then the video is blocked from appearing in that country. If this property is present and contains an empty list, the video is blocked in all countries. */
            allowed?: string[];
            /** @description A list of region codes that identify countries where the video is blocked. If this property is present and a country is not listed in its value, then the video is viewable in that country. If this property is present and contains an empty list, the video is viewable in all countries. */
            blocked?: string[];
        };
        /** @description Describes original video file properties, including technical details about audio and video streams, but also metadata information like content length, digitization time, or geotagging information. */
        VideoFileDetails: {
            /** @description The uploaded file's name. This field is present whether a video file or another type of file was uploaded. */
            fileName?: string;
            /** @description The date and time when the uploaded video file was created. The value is specified in ISO 8601 format. Currently, the following ISO 8601 formats are supported: - Date only: YYYY-MM-DD - Naive time: YYYY-MM-DDTHH:MM:SS - Time with timezone: YYYY-MM-DDTHH:MM:SS+HH:MM */
            creationTime?: string;
            /** @description The uploaded video file's combined (video and audio) bitrate in bits per second. */
            bitrateBps?: string;
            /** @description A list of audio streams contained in the uploaded video file. Each item in the list contains detailed metadata about an audio stream. */
            audioStreams?: components["schemas"]["VideoFileDetailsAudioStream"][];
            /** @description The uploaded video file's container format. */
            container?: string;
            /** @description The length of the uploaded video in milliseconds. */
            durationMs?: string;
            /** @description The uploaded file's size in bytes. This field is present whether a video file or another type of file was uploaded. */
            fileSize?: string;
            /**
             * @description The uploaded file's type as detected by YouTube's video processing engine. Currently, YouTube only processes video files, but this field is present whether a video file or another type of file was uploaded.
             * @enum {string}
             */
            fileType?: "video" | "audio" | "image" | "archive" | "document" | "project" | "other";
            /** @description A list of video streams contained in the uploaded video file. Each item in the list contains detailed metadata about a video stream. */
            videoStreams?: components["schemas"]["VideoFileDetailsVideoStream"][];
        };
        /** @description Information about an audio stream. */
        VideoFileDetailsAudioStream: {
            /** @description The audio stream's bitrate, in bits per second. */
            bitrateBps?: string;
            /** @description The number of audio channels that the stream contains. */
            channelCount?: number;
            /** @description The audio codec that the stream uses. */
            codec?: string;
            /** @description A value that uniquely identifies a video vendor. Typically, the value is a four-letter vendor code. */
            vendor?: string;
        };
        /** @description Information about a video stream. */
        VideoFileDetailsVideoStream: {
            /** @description The video stream's bitrate, in bits per second. */
            bitrateBps?: string;
            /** @description The video stream's frame rate, in frames per second. */
            frameRateFps?: number;
            /**
             * @description The amount that YouTube needs to rotate the original source content to properly display the video.
             * @enum {string}
             */
            rotation?: "none" | "clockwise" | "upsideDown" | "counterClockwise" | "other";
            /** @description The encoded video content's height in pixels. */
            heightPixels?: number;
            /** @description The video content's display aspect ratio, which specifies the aspect ratio in which the video should be displayed. */
            aspectRatio?: number;
            /** @description The encoded video content's width in pixels. You can calculate the video's encoding aspect ratio as width_pixels / height_pixels. */
            widthPixels?: number;
            /** @description A value that uniquely identifies a video vendor. Typically, the value is a four-letter vendor code. */
            vendor?: string;
            /** @description The video codec that the stream uses. */
            codec?: string;
        };
        VideoListResponse: {
            /**
             * @deprecated
             * @description Serialized EventId of the request which produced this response.
             */
            eventId?: string;
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set. */
            nextPageToken?: string;
            /** @description Identifies what kind of resource this is. Value: the fixed string "youtube#videoListResponse". */
            kind?: string;
            items?: components["schemas"]["Video"][];
            pageInfo?: components["schemas"]["PageInfo"];
            /**
             * @deprecated
             * @description The visitorId identifies the visitor.
             */
            visitorId?: string;
            /** @description Etag of this resource. */
            etag?: string;
            tokenPagination?: components["schemas"]["TokenPagination"];
            /** @description The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set. */
            prevPageToken?: string;
        };
        /** @description Details about the live streaming metadata. */
        VideoLiveStreamingDetails: {
            /**
             * Format: date-time
             * @description The time that the broadcast actually started. This value will not be available until the broadcast begins.
             */
            actualStartTime?: string;
            /**
             * Format: date-time
             * @description The time that the broadcast is scheduled to begin.
             */
            scheduledStartTime?: string;
            /** @description The number of viewers currently watching the broadcast. The property and its value will be present if the broadcast has current viewers and the broadcast owner has not hidden the viewcount for the video. Note that YouTube stops tracking the number of concurrent viewers for a broadcast when the broadcast ends. So, this property would not identify the number of viewers watching an archived video of a live broadcast that already ended. */
            concurrentViewers?: string;
            /**
             * Format: date-time
             * @description The time that the broadcast actually ended. This value will not be available until the broadcast is over.
             */
            actualEndTime?: string;
            /**
             * Format: date-time
             * @description The time that the broadcast is scheduled to end. If the value is empty or the property is not present, then the broadcast is scheduled to continue indefinitely.
             */
            scheduledEndTime?: string;
            /** @description The ID of the currently active live chat attached to this video. This field is filled only if the video is a currently live broadcast that has live chat. Once the broadcast transitions to complete this field will be removed and the live chat closed down. For persistent broadcasts that live chat id will no longer be tied to this video but rather to the new video being displayed at the persistent page. */
            activeLiveChatId?: string;
        };
        /** @description Localized versions of certain video properties (e.g. title). */
        VideoLocalization: {
            /** @description Localized version of the video's title. */
            title?: string;
            /** @description Localized version of the video's description. */
            description?: string;
        };
        /** @description Details about monetization of a YouTube Video. */
        VideoMonetizationDetails: {
            access?: components["schemas"]["AccessPolicy"];
        };
        /** @description Details about paid content, such as paid product placement, sponsorships or endorsement, contained in a YouTube video and a method to inform viewers of paid promotion. This data can only be retrieved by the video owner. */
        VideoPaidProductPlacementDetails: {
            /** @description This boolean represents whether the video contains Paid Product Placement, Studio equivalent: https://screenshot.googleplex.com/4Me79DE6AfT2ktp.png */
            hasPaidProductPlacement?: boolean;
        };
        /** @description Player to be used for a video playback. */
        VideoPlayer: {
            embedHeight?: string;
            /** @description The embed width */
            embedWidth?: string;
            /** @description An <iframe> tag that embeds a player that will play the video. */
            embedHtml?: string;
        };
        /** @description Describes processing status and progress and availability of some other Video resource parts. */
        VideoProcessingDetails: {
            /**
             * @description The video's processing status. This value indicates whether YouTube was able to process the video or if the video is still being processed.
             * @enum {string}
             */
            processingStatus?: "processing" | "succeeded" | "failed" | "terminated";
            /** @description This value indicates whether keyword (tag) suggestions are available for the video. Tags can be added to a video's metadata to make it easier for other users to find the video. You can retrieve these suggestions by requesting the suggestions part in your videos.list() request. */
            tagSuggestionsAvailability?: string;
            /** @description This value indicates whether thumbnail images have been generated for the video. */
            thumbnailsAvailability?: string;
            /** @description This value indicates whether video editing suggestions, which might improve video quality or the playback experience, are available for the video. You can retrieve these suggestions by requesting the suggestions part in your videos.list() request. */
            editorSuggestionsAvailability?: string;
            processingProgress?: components["schemas"]["VideoProcessingDetailsProcessingProgress"];
            /**
             * @description The reason that YouTube failed to process the video. This property will only have a value if the processingStatus property's value is failed.
             * @enum {string}
             */
            processingFailureReason?: "uploadFailed" | "transcodeFailed" | "streamingFailed" | "other";
            /** @description This value indicates whether file details are available for the uploaded video. You can retrieve a video's file details by requesting the fileDetails part in your videos.list() request. */
            fileDetailsAvailability?: string;
            /** @description This value indicates whether the video processing engine has generated suggestions that might improve YouTube's ability to process the the video, warnings that explain video processing problems, or errors that cause video processing problems. You can retrieve these suggestions by requesting the suggestions part in your videos.list() request. */
            processingIssuesAvailability?: string;
        };
        /** @description Video processing progress and completion time estimate. */
        VideoProcessingDetailsProcessingProgress: {
            /** @description An estimate of the total number of parts that need to be processed for the video. The number may be updated with more precise estimates while YouTube processes the video. */
            partsTotal?: string;
            /** @description An estimate of the amount of time, in millseconds, that YouTube needs to finish processing the video. */
            timeLeftMs?: string;
            /** @description The number of parts of the video that YouTube has already processed. You can estimate the percentage of the video that YouTube has already processed by calculating: 100 * parts_processed / parts_total Note that since the estimated number of parts could increase without a corresponding increase in the number of parts that have already been processed, it is possible that the calculated progress could periodically decrease while YouTube processes a video. */
            partsProcessed?: string;
        };
        /** @description DEPRECATED. b/157517979: This part was never populated after it was added. However, it sees non-zero traffic because there is generated client code in the wild that refers to it [1]. We keep this field and do NOT remove it because otherwise V3 would return an error when this part gets requested [2]. [1] https://developers.google.com/resources/api-libraries/documentation/youtube/v3/csharp/latest/classGoogle_1_1Apis_1_1YouTube_1_1v3_1_1Data_1_1VideoProjectDetails.html [2] http://google3/video/youtube/src/python/servers/data_api/common.py?l=1565-1569&rcl=344141677 */
        VideoProjectDetails: Record<string, never>;
        /** @description Recording information associated with the video. */
        VideoRecordingDetails: {
            /** @description The text description of the location where the video was recorded. */
            locationDescription?: string;
            location?: components["schemas"]["GeoPoint"];
            /**
             * Format: date-time
             * @description The date and time when the video was recorded.
             */
            recordingDate?: string;
        };
        /** @description Basic details about a video, including title, description, uploader, thumbnails and category. */
        VideoSnippet: {
            /** @description The ID that YouTube uses to uniquely identify the channel that the video was uploaded to. */
            channelId?: string;
            /** @description The default_audio_language property specifies the language spoken in the video's default audio track. */
            defaultAudioLanguage?: string;
            /** @description The video's description. @mutable youtube.videos.insert youtube.videos.update */
            description?: string;
            /** @description The video's title. @mutable youtube.videos.insert youtube.videos.update */
            title?: string;
            /** @description The language of the videos's default snippet. */
            defaultLanguage?: string;
            /**
             * Format: date-time
             * @description The date and time when the video was uploaded.
             */
            publishedAt?: string;
            /** @description The YouTube video category associated with the video. */
            categoryId?: string;
            thumbnails?: components["schemas"]["ThumbnailDetails"];
            /**
             * @description Indicates if the video is an upcoming/active live broadcast. Or it's "none" if the video is not an upcoming/active live broadcast.
             * @enum {string}
             */
            liveBroadcastContent?: "none" | "upcoming" | "live" | "completed";
            /** @description Channel title for the channel that the video belongs to. */
            channelTitle?: string;
            localized?: components["schemas"]["VideoLocalization"];
            /** @description A list of keyword tags associated with the video. Tags may contain spaces. */
            tags?: string[];
        };
        /** @description Statistics about the video, such as the number of times the video was viewed or liked. */
        VideoStatistics: {
            /** @description The number of users who have indicated that they disliked the video by giving it a negative rating. */
            dislikeCount?: string;
            /** @description The number of times the video has been viewed. */
            viewCount?: string;
            /** @description The number of users who have indicated that they liked the video by giving it a positive rating. */
            likeCount?: string;
            /**
             * @deprecated
             * @description The number of users who currently have the video marked as a favorite video.
             */
            favoriteCount?: string;
            /** @description The number of comments for the video. */
            commentCount?: string;
        };
        /** @description Basic details about a video category, such as its localized title. Next Id: 19 */
        VideoStatus: {
            /**
             * Format: date-time
             * @description The date and time when the video is scheduled to publish. It can be set only if the privacy status of the video is private..
             */
            publishAt?: string;
            /** @description This value indicates if the video can be embedded on another website. @mutable youtube.videos.insert youtube.videos.update */
            embeddable?: boolean;
            /** @description This value indicates if the extended video statistics on the watch page can be viewed by everyone. Note that the view count, likes, etc will still be visible if this is disabled. @mutable youtube.videos.insert youtube.videos.update */
            publicStatsViewable?: boolean;
            /** @description Indicates if the video contains altered or synthetic media. */
            containsSyntheticMedia?: boolean;
            /**
             * @description The status of the uploaded video.
             * @enum {string}
             */
            uploadStatus?: "uploaded" | "processed" | "failed" | "rejected" | "deleted";
            /**
             * @description This value explains why a video failed to upload. This property is only present if the uploadStatus property indicates that the upload failed.
             * @enum {string}
             */
            failureReason?: "conversion" | "invalidFile" | "emptyFile" | "tooSmall" | "codec" | "uploadAborted";
            /**
             * @description The video's license. @mutable youtube.videos.insert youtube.videos.update
             * @enum {string}
             */
            license?: "youtube" | "creativeCommon";
            /**
             * @description The video's privacy status.
             * @enum {string}
             */
            privacyStatus?: "public" | "unlisted" | "private";
            madeForKids?: boolean;
            /**
             * @description This value explains why YouTube rejected an uploaded video. This property is only present if the uploadStatus property indicates that the upload was rejected.
             * @enum {string}
             */
            rejectionReason?: "copyright" | "inappropriate" | "duplicate" | "termsOfUse" | "uploaderAccountSuspended" | "length" | "claim" | "uploaderAccountClosed" | "trademark" | "legal";
            selfDeclaredMadeForKids?: boolean;
        };
        /** @description Specifies suggestions on how to improve video content, including encoding hints, tag suggestions, and editor suggestions. */
        VideoSuggestions: {
            /** @description A list of errors that will prevent YouTube from successfully processing the uploaded video video. These errors indicate that, regardless of the video's current processing status, eventually, that status will almost certainly be failed. */
            processingErrors?: ("audioFile" | "imageFile" | "projectFile" | "notAVideoFile" | "docFile" | "archiveFile" | "unsupportedSpatialAudioLayout")[];
            /** @description A list of reasons why YouTube may have difficulty transcoding the uploaded video or that might result in an erroneous transcoding. These warnings are generated before YouTube actually processes the uploaded video file. In addition, they identify issues that are unlikely to cause the video processing to fail but that might cause problems such as sync issues, video artifacts, or a missing audio track. */
            processingWarnings?: ("unknownContainer" | "unknownVideoCodec" | "unknownAudioCodec" | "inconsistentResolution" | "hasEditlist" | "problematicVideoCodec" | "problematicAudioCodec" | "unsupportedVrStereoMode" | "unsupportedSphericalProjectionType" | "unsupportedHdrPixelFormat" | "unsupportedHdrColorMetadata" | "problematicHdrLookupTable")[];
            /** @description A list of video editing operations that might improve the video quality or playback experience of the uploaded video. */
            editorSuggestions?: ("videoAutoLevels" | "videoStabilize" | "videoCrop" | "audioQuietAudioSwap")[];
            /** @description A list of suggestions that may improve YouTube's ability to process the video. */
            processingHints?: ("nonStreamableMov" | "sendBestQualityVideo" | "sphericalVideo" | "spatialAudio" | "vrVideo" | "hdrVideo")[];
            /** @description A list of keyword tags that could be added to the video's metadata to increase the likelihood that users will locate your video when searching or browsing on YouTube. */
            tagSuggestions?: components["schemas"]["VideoSuggestionsTagSuggestion"][];
        };
        /** @description A single tag suggestion with its relevance information. */
        VideoSuggestionsTagSuggestion: {
            /** @description The keyword tag suggested for the video. */
            tag?: string;
            /** @description A set of video categories for which the tag is relevant. You can use this information to display appropriate tag suggestions based on the video category that the video uploader associates with the video. By default, tag suggestions are relevant for all categories if there are no restricts defined for the keyword. */
            categoryRestricts?: string[];
        };
        /** @description Freebase topic information related to the video. */
        VideoTopicDetails: {
            /** @description A list of Wikipedia URLs that provide a high-level description of the video's content. */
            topicCategories?: string[];
            /** @description A list of Freebase topic IDs that are centrally associated with the video. These are topics that are centrally featured in the video, and it can be said that the video is mainly about each of these. You can retrieve information about each topic using the < a href="http://wiki.freebase.com/wiki/Topic_API">Freebase Topic API. */
            topicIds?: string[];
            /** @description Similar to topic_id, except that these topics are merely relevant to the video. These are topics that may be mentioned in, or appear in the video. You can retrieve information about each topic using Freebase Topic API. */
            relevantTopicIds?: string[];
        };
        /** @description Branding properties for the watch. All deprecated. */
        WatchSettings: {
            /** @description The background color for the video watch page's branded area. */
            textColor?: string;
            /** @description The text color for the video watch page's branded area. */
            backgroundColor?: string;
            /** @description An ID that uniquely identifies a playlist that displays next to the video player. */
            featuredPlaylistId?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
