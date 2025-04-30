import vlc
import threading
import requests
import datetime 
import time
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.popup import Popup
from kivy.uix.spinner import Spinner
from kivy.clock import Clock
from kivy.uix.textinput import TextInput
from kivy.core.window import Window
from kivy.core.text import LabelBase
# 漢語字體
LabelBase.register(name="SourceHanSans", fn_regular="SourceHanSansLite.ttf")
# 设置全局字体
LabelBase.default = "SourceHanSans"

class MusicPlayerApp(App):
    def build(self):
        self.player = vlc.MediaPlayer()
        self.alarm_time = "未设置"
        self.stream_url = "http://103.145.191.20/shared/music/Mars_Shade.mp3"
        self.font_size = 20
        self.font_sizes = {"Big": 25, "Middle": 20, "Small": 18}
        self.selected_font_size = "Middle"
        self.alarm_thread_running = False  # 線程初始化
        self.layout = BoxLayout(orientation="vertical", spacing=10, padding=10)

        self.label_info = Label(text="點擊按鈕試聽鬧鐘音頻", font_size=self.font_size, font_name="SourceHanSans" )
        self.layout.add_widget(self.label_info)

        self.stream_button = Button(text="音頻試聽", size_hint=(1, 0.2), on_press=self.play_music, font_name="SourceHanSans")
        self.layout.add_widget(self.stream_button)

        self.setting_button = Button(text="設定調整", size_hint=(1, 0.2), font_name="SourceHanSans", on_press=self.open_setting)
        self.layout.add_widget(self.setting_button)

        self.label_time = Label(text=f"預設時間：\n{self.alarm_time}", font_name="SourceHanSans", font_size=self.font_size)
        self.layout.add_widget(self.label_time)

        self.label_stream = Label(text=f"預設音頻：\n{self.stream_url}", font_name="SourceHanSans", font_size=self.font_size)
        self.layout.add_widget(self.label_stream)

        self.font_size_label = Label(text="選單調整字體大小", font_name="SourceHanSans", font_size=self.font_size)
        self.layout.add_widget(self.font_size_label)

        self.font_size_menu = Spinner(text=self.selected_font_size, values=("Big", "Middle", "Small"), size_hint=(1, 0.2))
        self.font_size_menu.bind(text=self.update_font_size)
        self.layout.add_widget(self.font_size_menu)

        return self.layout

    def play_music(self, instance):
        try:
            self.player = vlc.MediaPlayer(self.stream_url)
            self.player.play()
            print("Now we playing the stream.")
        except Exception as e:
            print(f"Error：{e}")
            self.show_popup("Failed", "There are some errors happening, please check the program")

    def open_setting(self, instance):
        layout = BoxLayout(orientation="vertical", spacing=10, padding=10)
        time_input = TextInput(hint_text="Setting the alarm time: (HH:MM)", multiline=False)
        stream_input = TextInput(hint_text="Setting the stream Link", multiline=False)

        def save_settings(instance):
            new_alarm_time = time_input.text
            new_stream_url = stream_input.text
            if new_alarm_time:
                try:
                    datetime.datetime.strptime(new_alarm_time, "%H:%M")
                    self.alarm_time = new_alarm_time
                    self.label_time.text = f"設定時間：\n{self.alarm_time}"
                    print(f"闹钟设置为：{self.alarm_time}")
                except ValueError:
                    self.show_popup("Setting Failed", "Fromat error, please follow the format (HH:MM)")
                    return

            if new_stream_url:
                if self.is_stream_valid(new_stream_url):
                    self.stream_url = new_stream_url
                    self.label_stream.text = f"設置音頻：\n{self.stream_url}"
                    print(f"音频流链接设置为：{self.stream_url}")
                else:
                    self.show_popup("Setting Failed", "This is an invaivd link.")

            if self.alarm_time != "Untitled":
                self.start_alarm_thread()

            popup.dismiss()

        save_button = Button(text="Save", size_hint=(1, 0.2), on_press=save_settings)
        layout.add_widget(time_input)
        layout.add_widget(stream_input)
        layout.add_widget(save_button)

        popup = Popup(title="The Application Setting", content=layout, size_hint=(None, None), size=(400, 300))
        popup.open()

    def update_font_size(self, instance, value):
        self.font_size = self.font_sizes[value]
        self.label_info.font_size = self.font_size
        self.stream_button.font_size = self.font_size
        self.setting_button.font_size = self.font_size
        self.label_time.font_size = self.font_size
        self.label_stream.font_size = self.font_size
        self.font_size_label.font_size = self.font_size
        self.font_size_menu.font_size = self.font_size

    def check_alarm(self):
        while self.alarm_thread_running:
            current_time = time.strftime("%H:%M")
            if current_time == self.alarm_time:
                print("闹钟时间到，开始播放音频流！")
                if self.player.is_playing():
                    self.player.stop()
                self.play_music(None)
                self.alarm_thread_running = False
                break
            time.sleep(10)

    def start_alarm_thread(self):
        if self.alarm_thread_running:
            print("闹钟线程已启动，无需重复启动。")
            return
        self.alarm_thread_running = True
        self.alarm_thread = threading.Thread(target=self.check_alarm, daemon=True)
        self.alarm_thread.start()

    def is_stream_valid(self, url):
        try:
            response = requests.head(url, timeout=5)
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"验证链接失败：{e}")
            return False

    def show_popup(self, title, message):
        popup = Popup(title=title, content=Label(text=message), size_hint=(None, None), size=(400, 200))
        popup.open()

if __name__ == "__main__":
    MusicPlayerApp().run()
