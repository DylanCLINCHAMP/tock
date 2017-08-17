/*
 * Copyright (C) 2017 VSCT
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package fr.vsct.tock.translator

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.whenever
import fr.vsct.tock.shared.defaultLocale
import fr.vsct.tock.shared.defaultNamespace
import fr.vsct.tock.translator.UserInterfaceType.textChat
import org.junit.After
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals

/**
 *
 */
class TranslatorTest : AbstractTest() {

    @Before
    fun before() {
        Translator.enabled = true
    }

    @After
    fun after() {
        Translator.enabled = false
    }

    @Test
    fun formatMessage_shouldHandleWell_NullArgValue() {
        val result = Translator.formatMessage("a {0}", defaultLocale, textChat, listOf(null))
        assertEquals("a ", result)
    }

    @Test
    fun translate_shouldReturnsRightValue_whenAlreadyTranslatedStringIsPassed() {
        val category = "category"
        val toTranslate = "aaa"
        val target = "bbb"
        whenever(i18nDAO.getLabelById(any())).thenReturn(
                I18nLabel(
                        "a",
                        defaultNamespace,
                        category,
                        listOf(I18nLocalizedLabel(
                                defaultLocale,
                                textChat,
                                target
                        ))))

        val key = I18nLabelKey(
                Translator.getKeyFromDefaultLabel(toTranslate),
                defaultNamespace,
                category,
                toTranslate)

        val translated = Translator.translate(key, defaultLocale, textChat)
        assertEquals(target, translated.toString())

        val key2 = I18nLabelKey(
                Translator.getKeyFromDefaultLabel(translated),
                defaultNamespace,
                category,
                translated)

        val translated2 = Translator.translate(key2, defaultLocale, textChat)

        assertEquals(translated, translated2)
    }
}