package utils

import (
	"os"
)

type Config struct {
	Js struct {
		ESMDirectory    string `yaml:"esmDirectory"`
		CJSDirectory    string `yaml:"cjsDirectory"`
		ESMMetaFilePath string `yaml:"esmMetaFilePath"`
		CJSMetaFilePath string `yaml:"cjsMetaFilePath"`
		RoutesRoot      string `yaml:"routesRoot"`
	} `yaml:"js"`

	Production bool `yaml:"production"`
}

func LoadConfig(path string) (*Config, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	config := Config{}
	err = yaml.Unmarshal(content, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
