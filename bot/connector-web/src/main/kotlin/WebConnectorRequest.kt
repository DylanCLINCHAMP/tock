/*
 * Copyright (C) 2017/2020 e-voyageurs technologies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package ai.tock.bot.connector.web

import ai.tock.bot.engine.action.SendChoice
import ai.tock.bot.engine.action.SendChoice.Companion.REFERRAL_PARAMETER
import ai.tock.bot.engine.action.SendSentence
import ai.tock.bot.engine.event.Event
import ai.tock.bot.engine.event.ReferralParametersEvent
import ai.tock.bot.engine.user.PlayerId
import ai.tock.bot.engine.user.PlayerType.bot
import ai.tock.shared.defaultLocale
import java.util.Locale

data class WebConnectorRequest(
    override val query: String? = null,
    override val payload: String? = null,
    override val userId: String,
    override val locale: Locale = defaultLocale,
    override val ref: String? = null
) : WebConnectorRequestContract {

    fun toEvent(applicationId: String): Event =
        if (query != null) {
            SendSentence(
                PlayerId(userId),
                applicationId,
                PlayerId(applicationId, bot),
                query
            )
        } else if (payload != null) {
            val (intent, parameters) = SendChoice.decodeChoiceId(payload)
            SendChoice(
                playerId = PlayerId(userId),
                applicationId = applicationId,
                recipientId = PlayerId(applicationId, bot),
                intentName = intent,
                parameters = parameters + (if (ref == null) emptyMap() else mapOf(REFERRAL_PARAMETER to ref))
            )
        } else {
            if (ref != null) {
                ReferralParametersEvent(
                    userId = PlayerId(userId),
                    recipientId = PlayerId(applicationId, bot),
                    applicationId = applicationId,
                    ref = ref
                )
            } else {
                error("query & payload are both null")
            }
        }

}