import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: '123',
        email: registerDto.email,
        username: registerDto.username,
        passwordHash: hashedPassword,
        displayName: null,
        bio: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: registerDto.username },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          username: registerDto.username,
          passwordHash: hashedPassword,
        },
      });
      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: '456',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException if username already exists', async () => {
      const registerDto = {
        email: 'new@example.com',
        username: 'existinguser',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: '789',
          username: registerDto.username,
        });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const user = {
        id: '123',
        email: loginDto.email,
        username: 'testuser',
        passwordHash: 'hashedPassword',
      };

      const accessToken = 'jwt.access.token';

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.passwordHash,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        username: user.username,
      });
      expect(result).toEqual({ accessToken });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'wrong@example.com',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword!',
      };

      const user = {
        id: '123',
        passwordHash: 'hashedPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateToken', () => {
    it('should return user for valid token', async () => {
      const userId = '123';
      const user = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateToken(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(user);
    });

    it('should return null for invalid user id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateToken('invalid-id');

      expect(result).toBeNull();
    });
  });
});
